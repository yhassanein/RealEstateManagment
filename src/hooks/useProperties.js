import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(*)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setProperties(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  async function createProperty(values) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('properties').insert({ ...values, owner_id: user.id })
    if (error) throw new Error(error.message)
    await fetchProperties()
  }

  async function updateProperty(id, values) {
    const { error } = await supabase.from('properties').update(values).eq('id', id)
    if (error) throw new Error(error.message)
    await fetchProperties()
  }

  async function deleteProperty(id) {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchProperties()
  }

  async function createUnit(propertyId, values) {
    const { error } = await supabase.from('units').insert({ ...values, property_id: propertyId })
    if (error) throw new Error(error.message)
    await fetchProperties()
  }

  async function deleteUnit(id) {
    const { error } = await supabase.from('units').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchProperties()
  }

  return { properties, loading, error, refetch: fetchProperties, createProperty, updateProperty, deleteProperty, createUnit, deleteUnit }
}
