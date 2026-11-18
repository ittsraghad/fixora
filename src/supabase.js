import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
export const STATUSES = ['Submitted','Under Review','Assigned','In Progress','Waiting for Parts','Resolved','Closed']
export const logUpdate = (request_id, message) => supabase.from('request_updates').insert({ request_id, message })
export function useLive(cb) {
  useEffect(() => {
    const ch = supabase.channel('live-' + Math.random()).on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () => cb()).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])
}
