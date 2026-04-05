import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useLeases } from '@/hooks/useLeases'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, ExternalLink, Download } from 'lucide-react'

export default function MyLeasePage() {
  const { profile } = useAuth()
  const [tenantId, setTenantId] = useState(null)

  useEffect(() => {
    async function loadTenant() {
      const { data } = await supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .single()
      if (data) setTenantId(data.id)
    }
    if (profile) loadTenant()
  }, [profile])

  const { leases, loading, getLeaseUrl } = useLeases(tenantId)
  const [viewUrl, setViewUrl] = useState(null)

  async function handleView(storagePath) {
    const url = await getLeaseUrl(storagePath)
    setViewUrl(url)
  }

  async function handleDownload(storagePath, fileName) {
    const url = await getLeaseUrl(storagePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
  }

  if (!tenantId && !loading) return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
      <p className="font-bold text-sm">No active tenancy</p>
      <p className="text-xs text-muted-foreground mt-1">No active tenancy found.</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Documents</p>
        <h1 className="text-4xl font-black tracking-tight leading-none">My Lease</h1>
      </div>

      {loading ? (
        <Skeleton className="h-16 rounded-none" />
      ) : leases.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
          <p className="font-bold text-sm">No lease on file</p>
          <p className="text-xs text-muted-foreground mt-1">Your landlord hasn't uploaded your lease yet.</p>
        </div>
      ) : (
        <div className="bg-border gap-px flex flex-col">
          {leases.map((lease) => (
            <div key={lease.id} className="bg-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-blue-100 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">{lease.file_name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lease.start_date && lease.end_date
                      ? `${new Date(lease.start_date).toLocaleDateString()} – ${new Date(lease.end_date).toLocaleDateString()}`
                      : 'Uploaded ' + new Date(lease.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleView(lease.storage_path)}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleDownload(lease.storage_path, lease.file_name)}>
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewUrl && (
        <div className="border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Lease Preview</span>
            <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" onClick={() => setViewUrl(null)}>
              Close
            </button>
          </div>
          <iframe src={viewUrl} className="w-full h-[80vh]" title="Lease Agreement" />
        </div>
      )}
    </div>
  )
}
