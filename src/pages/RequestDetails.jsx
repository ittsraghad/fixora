import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star, Camera } from 'lucide-react'
import { supabase, STATUSES, logUpdate } from '../supabase'
import { useAuth } from '../auth'
import { Chat, fmtDate } from './Extras'
export default function RequestDetails() {
  const { id } = useParams(), { profile } = useAuth(), role = profile.role
  const [r, setR] = useState(null), [files, setFiles] = useState([]), [log, setLog] = useState([]), [rev, setRev] = useState(null), [stars, setStars] = useState(5), [note, setNote] = useState('')
  const load = async () => {
    const { data } = await supabase.from('maintenance_requests').select('*, maintenance_categories(name), tech:profiles!maintenance_requests_technician_id_fkey(full_name,specialty)').eq('id', id).single()
    setR(data)
    setFiles((await supabase.from('request_attachments').select('*').eq('request_id', id)).data || [])
    setLog((await supabase.from('request_updates').select('*').eq('request_id', id).order('created_at')).data || [])
    setRev((await supabase.from('reviews').select('*').eq('request_id', id).maybeSingle()).data)
  }
  useEffect(() => { load() }, [id])
  if (!r) return <p className="empty">Loading…</p>
  const step = STATUSES.indexOf(r.status)
  const patch = async (v, msg) => { await supabase.from('maintenance_requests').update({ ...v, updated_at: new Date() }).eq('id', id); await logUpdate(id, msg); load() }
  async function upload(e) {
    for (const file of e.target.files) {
      const path = `${id}/done-`+`${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${(file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')}`
      const up = await supabase.storage.from('request-images').upload(path, file)
      if (!up.error) await supabase.from('request_attachments').insert({ request_id: id, kind: 'completion', url: supabase.storage.from('request-images').getPublicUrl(path).data.publicUrl })
    }
    await logUpdate(id, 'Completion photos added'); load()
  }
  const imgs = k => files.filter(a => a.kind === k).map(a => <a key={a.id} href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt=""/></a>)
  return <div className="stack"><div><h1>{r.title}</h1><span className="badge">{r.request_number}</span> <span className={`badge ${r.priority}`}>{r.priority}</span> <span className={`badge ${r.status}`}>{r.status}</span></div>
    <div className="card"><div className="tl">{STATUSES.filter(s => s !== 'Waiting for Parts').map(s => <span key={s} className={STATUSES.indexOf(s) <= step ? 'on' : ''}>{s}</span>)}</div></div>
    <div className="two"><div className="card"><h3>Details</h3><p>{r.description || 'No description.'}</p>
      <p style={{ color: 'var(--muted)' }}>{r.maintenance_categories?.name} · {[r.building, r.unit, r.location_details].filter(Boolean).join(', ')}</p>
      <div className="thumbs">{imgs('problem')}</div>
      {files.some(a => a.kind === 'completion') && <><h3 style={{ marginTop: '1.2rem' }}>After the repair</h3><div className="thumbs">{imgs('completion')}</div></>}</div>
      <div className="card stack"><div><h3>Technician</h3>{r.tech ? <p style={{ margin: 0 }}><b>{r.tech.full_name}</b><br/>{r.tech.specialty}</p> : <p style={{ color: 'var(--muted)', margin: 0 }}>Not assigned yet.</p>}</div>
        {role === 'admin' && <div><label>Priority</label><select value={r.priority} onChange={e => patch({ priority: e.target.value }, `Priority set to ${e.target.value}`)}>{['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}</select>
          <label>Status</label><select value={r.status} onChange={e => patch({ status: e.target.value }, `Status changed to ${e.target.value}`)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>}
        {role === 'technician' && <div style={{ display: 'grid', gap: '.6rem' }}>
          <button className="btn teal" onClick={() => patch({ status: 'In Progress' }, 'Work started')}>Start work</button>
          <button className="btn ghost" onClick={() => patch({ status: 'Waiting for Parts' }, 'Waiting for parts')}>Waiting for parts</button>
          <label className="btn ghost" style={{ margin: 0, justifyContent: 'center', cursor: 'pointer' }}><Camera size={16}/>Add completion photos<input type="file" accept="image/*" multiple hidden onChange={upload}/></label>
          <button className="btn" onClick={() => patch({ status: 'Resolved' }, 'Issue resolved')}>Mark as resolved</button></div>}
        {role === 'resident' && r.status === 'Resolved' && <button className="btn teal" onClick={() => patch({ status: 'Closed' }, 'Resident confirmed the fix')}>Confirm it is fixed</button>}
        {role === 'resident' && r.status === 'Closed' && (rev ? <p>Your rating: {'★'.repeat(rev.rating)}</p> : <div><h3 style={{ fontSize: '1.1rem' }}>Rate the service</h3>
          <div style={{ display: 'flex', gap: '.2rem' }}>{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`${n} stars`} onClick={() => setStars(n)} style={{ background: 'none', border: 0, cursor: 'pointer' }}><Star fill={n <= stars ? '#F0AD4E' : 'none'} color="#F0AD4E"/></button>)}</div>
          <textarea rows={2} placeholder="Anything we should know?" value={note} onChange={e => setNote(e.target.value)} style={{ margin: '.6rem 0' }}/>
          <button className="btn" onClick={async () => { await supabase.from('reviews').insert({ request_id: id, rating: stars, comment: note }); load() }}>Send rating</button></div>)}</div></div>
    <Chat requestId={id}/>
    <div className="card"><h3>Activity</h3><div className="log">{log.map(l => <div key={l.id}>{l.message}<br/><small>{fmtDate(l.created_at)}</small></div>)}</div></div></div>
}
