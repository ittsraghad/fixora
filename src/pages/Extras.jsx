import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
export const fmtDate = d => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export function Notifications() {
  const [rows, setRows] = useState([]), nav = useNavigate(), { profile } = useAuth()
  const load = async () => setRows((await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)).data || [])
  useEffect(() => { load() }, [])
  const base = { admin: '/admin', technician: '/tech', resident: '/app' }[profile.role]
  async function open(n) { await supabase.from('notifications').update({ read: true }).eq('id', n.id); nav(`${base}/requests/${n.request_id}`) }
  return <><h1>Notifications</h1><div className="card">{rows.length ? rows.map(n => <div key={n.id} onClick={() => open(n)} className="mini" style={{ cursor: 'pointer', opacity: n.read ? .6 : 1 }}>
    <span>{n.message}<br/><small style={{ color: 'var(--muted)' }}>{fmtDate(n.created_at)}</small></span>{!n.read && <span className="badge">New</span>}</div>) : <p className="empty">You are all caught up.</p>}</div></>
}
export function Profile() {
  const { profile } = useAuth(), [f, setF] = useState({ full_name: profile.full_name || '', phone: profile.phone || '' }), [ok, setOk] = useState(false)
  return <><h1>My profile</h1><div className="card stack" style={{ maxWidth: 480 }}>
    <div><label>Full name</label><input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })}/></div>
    <div><label>Phone</label><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}/></div>
    <p style={{ color: 'var(--muted)', margin: 0 }}>{profile.email} · {profile.role}</p>
    <button className="btn teal" style={{ justifySelf: 'start' }} onClick={async () => { await supabase.from('profiles').update(f).eq('id', profile.id); setOk(true) }}>Save changes</button>{ok && <p style={{ margin: 0, color: 'var(--ok)' }}>Saved.</p>}</div></>
}
const Chart = ({ title, data }) => <div className="card"><h3>{title}</h3><ResponsiveContainer height={240}><BarChart data={data}><CartesianGrid stroke="#E3E9EE" vertical={false}/><XAxis dataKey="name" tickLine={false} fontSize={12}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12}/><Tooltip cursor={{ fill: '#F5F7FA' }}/><Bar dataKey="value" fill="#16A6A1" radius={[8, 8, 0, 0]}/></BarChart></ResponsiveContainer></div>
const count = (rows, key) => Object.entries(rows.reduce((a, r) => (a[key(r)] = (a[key(r)] || 0) + 1, a), {})).map(([name, value]) => ({ name, value }))
export function Reports() {
  const [rows, setRows] = useState([]), [techs, setTechs] = useState([]), [revs, setRevs] = useState([])
  useEffect(() => { (async () => {
    setRows((await supabase.from('maintenance_requests').select('*, maintenance_categories(name)')).data || [])
    setTechs((await supabase.from('profiles').select('id,full_name').eq('role', 'technician')).data || [])
    setRevs((await supabase.from('reviews').select('rating')).data || []) })() }, [])
  const avg = revs.length ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1) : '–'
  const perf = techs.map(t => ({ name: t.full_name?.split(' ')[0], value: rows.filter(r => r.technician_id === t.id && ['Resolved', 'Closed'].includes(r.status)).length }))
  const exportCsv = () => { const csv = ['Number,Title,Category,Priority,Status,Created', ...rows.map(r => [r.request_number, `"${r.title}"`, r.maintenance_categories?.name, r.priority, r.status, r.created_at].join(','))].join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'fixora-requests.csv'; a.click() }
  return <><div style={{ display: 'flex', justifyContent: 'space-between' }}><h1>Reports</h1><button className="btn ghost" onClick={exportCsv}>Export CSV</button></div>
    <div className="stats"><div className="card stat"><b>{avg}</b><span>Average rating</span></div><div className="card stat"><b>{rows.length}</b><span>All requests</span></div></div>
    <div className="two"><Chart title="Requests by category" data={count(rows, r => r.maintenance_categories?.name || 'Other')}/><Chart title="Requests by month" data={count(rows, r => new Date(r.created_at).toLocaleString('en', { month: 'short' }))}/>
      <Chart title="Resolved by technician" data={perf}/><Chart title="Requests by priority" data={count(rows, r => r.priority)}/></div></>
}
export function Chat({ requestId }) {
  const { profile } = useAuth(), [msgs, setMsgs] = useState([]), [t, setT] = useState('')
  const load = async () => setMsgs((await supabase.from('messages').select('*, profiles(full_name)').eq('request_id', requestId).order('created_at')).data || [])
  useEffect(() => { load(); const ch = supabase.channel('m' + requestId).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, load).subscribe(); return () => supabase.removeChannel(ch) }, [requestId])
  async function send(e) { e.preventDefault(); if (!t.trim()) return; await supabase.from('messages').insert({ request_id: requestId, body: t }); setT('') }
  return <div className="card"><h3>Messages</h3><div className="stack" style={{ gap: '.5rem', marginBottom: '1rem' }}>{msgs.length ? msgs.map(m => { const me = m.sender_id === profile.id; return <div key={m.id} style={{ justifySelf: me ? 'end' : 'start', maxWidth: '75%', background: me ? 'var(--teal)' : 'var(--bg)', color: me ? '#fff' : 'var(--text)', padding: '.6rem .9rem', borderRadius: 16 }}>
    <small style={{ opacity: .75 }}>{me ? 'You' : m.profiles?.full_name || 'Team'}</small><br/>{m.body}</div> }) : <p className="empty">No messages yet. Ask a question about this request.</p>}</div>
    <form onSubmit={send} style={{ display: 'flex', gap: '.6rem' }}><input value={t} onChange={e => setT(e.target.value)} placeholder="Write a message"/><button className="btn">Send</button></form></div>
}
