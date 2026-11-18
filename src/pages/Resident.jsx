import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { supabase, logUpdate, useLive } from '../supabase'
import { useAuth } from '../auth'
const friendly = m => /fetch|network/i.test(m) ? 'Cannot reach the server. Check your connection and try again.' : m
export const fmt = d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })
export function RequestTable({ rows, base, extra }) {
  const nav = useNavigate()
  if (!rows.length) return <p className="empty">Nothing here yet. When you send a request, it will show up in this list.</p>
  return <table><thead><tr><th>ID</th><th>Issue</th><th>Date</th><th>Priority</th><th>Status</th>{extra && <th/>}</tr></thead><tbody>
    {rows.map(r => <tr className="row" key={r.id} onClick={() => nav(`${base}/${r.id}`)}><td>{r.request_number}</td><td>{r.title}</td><td>{fmt(r.created_at)}</td>
      <td><span className={`badge ${r.priority}`}>{r.priority}</span></td><td><span className={`badge ${r.status}`}>{r.status}</span></td>{extra && <td onClick={e => e.stopPropagation()}>{extra(r)}</td>}</tr>)}</tbody></table>
}
export function ResidentHome() {
  const { profile } = useAuth(), [rows, setRows] = useState([])
  const load = () => supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, []); useLive(load)
  const n = f => rows.filter(f).length
  const S = [['Total requests', rows.length], ['Pending', n(r => ['Submitted', 'Under Review'].includes(r.status))], ['In progress', n(r => ['Assigned', 'In Progress', 'Waiting for Parts'].includes(r.status))], ['Resolved', n(r => ['Resolved', 'Closed'].includes(r.status))]]
  return <><div className="pagehead"><div><h1>Welcome back, {profile?.full_name?.split(' ')[0]}</h1><p>Here is where your requests stand.</p></div><Link className="btn teal" to="/app/new">New request</Link></div>
    <div className="stats">{S.map(([l, v]) => <div className="card stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <div className="card"><h3>Recent requests</h3><RequestTable rows={rows.slice(0, 8)} base="/app/requests"/></div></>
}
export function CreateRequest() {
  const nav = useNavigate(), [cats, setCats] = useState([]), [files, setFiles] = useState([]), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [f, setF] = useState({ title: '', category_id: '', description: '', building: '', unit: '', location_details: '', priority: 'Medium' })
  useEffect(() => { supabase.from('maintenance_categories').select('*').then(({ data }) => { setCats(data || []); if (data?.[0]) setF(x => ({ ...x, category_id: data[0].id })) }) }, [])
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) { try { await send(e) } catch (x) { setBusy(false); setErr(friendly(x.message)) } }
  async function send(e) {
    e.preventDefault(); setBusy(true); setErr('')
    const { data: req, error } = await supabase.from('maintenance_requests').insert(f).select().single()
    if (error) { setBusy(false); return setErr(friendly(error.message)) }
    const failed = []
    for (const file of files) {
      const path = `${req.id}/`+`${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${(file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')}`
      const up = await supabase.storage.from('request-images').upload(path, file)
      if (up.error) failed.push(up.error.message); else await supabase.from('request_attachments').insert({ request_id: req.id, url: supabase.storage.from('request-images').getPublicUrl(path).data.publicUrl })
    }
    if (failed.length) alert('Some photos could not be uploaded: ' + failed[0]); await logUpdate(req.id, 'Request submitted'); nav(`/app/requests/${req.id}`)
  }
  return <><h1>New maintenance request</h1><form className="card stack" style={{maxWidth:720}} onSubmit={submit}>
    <div><label>What is the problem?</label><input required value={f.title} onChange={set('title')} placeholder="Water leaking under the kitchen sink"/></div>
    <div className="two"><div><label>Category</label><select value={f.category_id} onChange={set('category_id')}>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label>Priority</label><select value={f.priority} onChange={set('priority')}>{['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}</select></div></div>
    <div><label>Description</label><textarea rows={4} value={f.description} onChange={set('description')}/></div>
    <div className="two"><div><label>Building</label><input value={f.building} onChange={set('building')}/></div><div><label>Apartment or room</label><input value={f.unit} onChange={set('unit')}/></div></div>
    <div><label>Where exactly?</label><input value={f.location_details} onChange={set('location_details')}/></div>
    <div><label>Photos</label><label className="btn ghost" style={{margin:0,cursor:'pointer',width:'fit-content'}}><Camera size={16}/>Add photos<input type="file" accept="image/*" multiple hidden onChange={e => { const picked = [...e.target.files]; setFiles(prev => [...prev, ...picked]); e.target.value = '' }}/></label>
      {files.length > 0 && <small style={{display:'block',color:'var(--muted)',marginTop:'.5rem'}}>{files.length} photo(s) selected</small>}
      <div className="thumbs" style={{marginTop:'.6rem'}}>{files.map((x, i) => <div key={i} style={{position:'relative'}}><img src={URL.createObjectURL(x)} alt=""/><button type="button" aria-label="Remove photo" onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{position:'absolute',top:4,right:4,border:0,borderRadius:999,width:22,height:22,cursor:'pointer',background:'#fff',color:'#1B2B4B'}}>×</button></div>)}</div></div>
    {err && <p className="err">{err}</p>}<button className="btn teal" disabled={busy} style={{justifySelf:'start'}}>{busy ? 'Sending…' : 'Send request'}</button></form></>
}
