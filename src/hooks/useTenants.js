import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useTenants(propertyId) {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('tenants')
      .select('*, profiles(*), units(*), properties(name, address)')
      .order('created_at', { ascending: false })

    if (propertyId) query = query.eq('property_id', propertyId)

    const { data, error } = await query
    if (error) setError(error.message)
    else setTenants(data)
    setLoading(false)
  }, [propertyId])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  async function createTenant(values) {
    // Save owner's current session so we can restore it after signup
    const { data: { session: ownerSession } } = await supabase.auth.getSession()

    // Sign up the tenant — email confirmation must be disabled in Supabase Auth settings
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name, role: 'tenant' },
      },
    })
    if (signUpError) throw new Error(signUpError.message)

    const userId = authData.user?.id
    if (!userId) throw new Error('Failed to create user account')

    // Restore owner's session immediately
    await supabase.auth.setSession({
      access_token: ownerSession.access_token,
      refresh_token: ownerSession.refresh_token,
    })

    // Link the new user to their unit
    const { error: tenantError } = await supabase.from('tenants').insert({
      profile_id: userId,
      unit_id: values.unit_id,
      property_id: values.property_id,
      move_in_date: values.move_in_date || null,
      is_active: true,
    })
    if (tenantError) throw new Error(tenantError.message)

    await fetchTenants()
  }

  async function deactivateTenant(id) {
    const { error } = await supabase.from('tenants').update({ is_active: false }).eq('id', id)
    if (error) throw new Error(error.message)
    await fetchTenants()
  }

  return { tenants, loading, error, refetch: fetchTenants, createTenant, deactivateTenant }
}
