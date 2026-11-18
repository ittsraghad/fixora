import { useEffect, useState } from 'react'
import { supabase, logUpdate, useLive } from '../supabase'
import { RequestTable } from './Resident'
export default function TechHome() {
  const [rows, setRows] = useState([])
  const load = async () => setRows((await supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false })).data || [])
  useEffect(() => { load() }, []); useLive(load)
  async function set(r, status) { await supabase.from('maintenance_requests').update({ status, updated_at: new Date() }).eq('id', r.id); await logUpdate(r.id, `Status changed to ${status}`); load() }
  return <><h1>My tasks</h1><div className="card"><RequestTable rows={rows} base="/tech/requests" extra={r =>
    <select value="" onChange={e => e.target.value && set(r, e.target.value)}><option value="">Update…</option>{['In Progress', 'Waiting for Parts', 'Resolved'].map(s => <option key={s}>{s}</option>)}</select>}/></div></>
}
