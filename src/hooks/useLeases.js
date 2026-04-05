import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useLeases(tenantId) {
  const { profile } = useAuth()
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeases = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    let query = supabase.from('leases').select('*').order('uploaded_at', { ascending: false })
    if (tenantId) query = query.eq('tenant_id', tenantId)
    const { data, error } = await query
    if (error) setError(error.message)
    else setLeases(data ?? [])
    setLoading(false)
  }, [profile, tenantId])

  useEffect(() => { fetchLeases() }, [fetchLeases])

  async function uploadLease(targetTenantId, file, values) {
    const filePath = `${targetTenantId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('leases')
      .upload(filePath, file, { contentType: 'application/pdf' })
    if (uploadError) throw new Error(uploadError.message)

    // Get property_id from tenant record
    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select('property_id')
      .eq('id', targetTenantId)
      .single()
    if (tenantError) throw new Error(tenantError.message)

    const { error } = await supabase.from('leases').insert({
      tenant_id: targetTenantId,
      property_id: tenantRow.property_id,
      storage_path: filePath,
      file_name: file.name,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
    })
    if (error) throw new Error(error.message)
    await fetchLeases()
  }

  async function getLeaseUrl(storagePath) {
    const { data } = await supabase.storage
      .from('leases')
      .createSignedUrl(storagePath, 3600)
    return data?.signedUrl
  }

  async function deleteLease(id, storagePath) {
    await supabase.storage.from('leases').remove([storagePath])
    const { error } = await supabase.from('leases').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchLeases()
  }

  return { leases, loading, error, refetch: fetchLeases, uploadLease, getLeaseUrl, deleteLease }
}
