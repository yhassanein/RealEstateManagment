import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useMaintenanceRequests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRequests = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    let data, err

    if (profile.role === 'owner') {
      const result = await supabase
        .from('maintenance_requests')
        .select('*, tenants(*, profiles(full_name, email)), units(unit_number), properties(name), maintenance_photos(*)')
        .order('created_at', { ascending: false })
      data = result.data
      err = result.error
    } else {
      // Tenant: first find their tenant record
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .single()

      if (tenantRow) {
        const result = await supabase
          .from('maintenance_requests')
          .select('*, maintenance_photos(*)')
          .eq('tenant_id', tenantRow.id)
          .order('created_at', { ascending: false })
        data = result.data
        err = result.error
      } else {
        data = []
      }
    }

    if (err) setError(err.message)
    else setRequests(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function createRequest(values, photos = []) {
    // Get tenant record
    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select('id, unit_id, property_id')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .single()

    if (tenantError) throw new Error('No active tenant record found')

    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .insert({
        tenant_id: tenantRow.id,
        unit_id: tenantRow.unit_id,
        property_id: tenantRow.property_id,
        title: values.title,
        description: values.description,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Upload photos
    for (const photo of photos) {
      const filePath = `${request.id}/${Date.now()}_${photo.name}`
      const { error: uploadError } = await supabase.storage
        .from('maintenance-photos')
        .upload(filePath, photo)
      if (!uploadError) {
        await supabase.from('maintenance_photos').insert({
          request_id: request.id,
          storage_path: filePath,
          file_name: photo.name,
        })
      }
    }

    await fetchRequests()
  }

  async function updateStatus(id, status, ownerNotes) {
    const { error } = await supabase
      .from('maintenance_requests')
      .update({ status, owner_notes: ownerNotes, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
    await fetchRequests()
  }

  async function getPhotoUrl(storagePath) {
    const { data } = await supabase.storage
      .from('maintenance-photos')
      .createSignedUrl(storagePath, 3600)
    return data?.signedUrl
  }

  return { requests, loading, error, refetch: fetchRequests, createRequest, updateStatus, getPhotoUrl }
}
