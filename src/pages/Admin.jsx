import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase, STATUSES, logUpdate, useLive } from '../supabase'
import { RequestTable } from './Resident'
export function AdminHome() {
  const [rows, setRows] = useState([]), [techs, setTechs] = useState([]), [q, setQ] = useState(''), [st, setSt] = useState('')
  const load = async () => { setRows((await supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false })).data || []); setTechs((await supabase.from('profiles').select('*').eq('role', 'technician')).data || []) }
  useEffect(() => { load() }, []); useLive(load)
  async function assign(r, tid) { await supabase.from('maintenance_requests').update({ technician_id: tid || null, status: tid ? 'Assigned' : 'Under Review', updated_at: new Date() }).eq('id', r.id); await logUpdate(r.id, tid ? `Technician assigned: ${techs.find(t => t.id === tid)?.full_name}` : 'Technician removed'); load() }
  const shown = rows.filter(r => (r.title + r.request_number).toLowerCase().includes(q.toLowerCase()) && (!st || r.status === st))
  const chart = STATUSES.map(s => ({ name: s, value: rows.filter(r => r.status === s).length })).filter(d => d.value)
  const COL = ['#3A74BD', '#1B2B4B', '#C9A25B', '#3F9573', '#C0605E', '#8793A6', '#9DB9E0']
  const S = [['Total', rows.length], ['New', rows.filter(r => r.status === 'Submitted').length], ['Active', rows.filter(r => ['Assigned', 'In Progress', 'Waiting for Parts'].includes(r.status)).length], ['Resolved', rows.filter(r => ['Resolved', 'Closed'].includes(r.status)).length], ['Technicians', techs.length]]
  return <><h1>Requests</h1><div className="stats">{S.map(([l, v]) => <div className="card stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <div className="stack">
      <div className="card"><div style={{display:'flex',gap:'.6rem',marginBottom:'1rem'}}><input placeholder="Search by title or number" value={q} onChange={e => setQ(e.target.value)}/><select style={{width:'auto'}} value={st} onChange={e => setSt(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        <RequestTable rows={shown} base="/admin/requests" extra={r => <select value={r.technician_id || ''} onChange={e => assign(r, e.target.value)}><option value="">Assign…</option>{techs.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select>}/></div>
      <div className="card" style={{maxWidth:520}}><h3>By status</h3><ResponsiveContainer height={240}><PieChart><Pie data={chart} dataKey="value" innerRadius={50} outerRadius={85}>{chart.map((_, i) => <Cell key={i} fill={COL[i % 7]}/>)}</Pie><Tooltip/><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }}/></PieChart></ResponsiveContainer></div></div></>
}
export function AdminTechnicians() {
  const [rows, setRows] = useState([])
  const load = async () => setRows((await supabase.from('profiles').select('*').eq('role', 'technician')).data || [])
  useEffect(() => { load() }, [])
  const [em, setEm] = useState(''), [sp, setSp] = useState('Plumbing'), [msg, setMsg] = useState('')
  async function add(e) { e.preventDefault(); const { data } = await supabase.from('profiles').update({ role: 'technician', specialty: sp }).eq('email', em.trim()).select(); setMsg(data?.length ? 'Technician added.' : 'No account found with that email. Ask them to sign up first.'); setEm(''); load() }
  const toggle = async t => { await supabase.from('profiles').update({ active: !t.active }).eq('id', t.id); load() }
  return <><h1>Technicians</h1><form className="card" onSubmit={add} style={{display:'flex',gap:'.6rem',flexWrap:'wrap',alignItems:'center',marginBottom:'1.2rem'}}><input style={{flex:2,minWidth:200}} type="email" required placeholder="Email of a registered user" value={em} onChange={e => setEm(e.target.value)}/><select style={{flex:1}} value={sp} onChange={e => setSp(e.target.value)}>{['Plumbing','Electrical','AC','Carpentry','General'].map(x => <option key={x}>{x}</option>)}</select><button className="btn teal">Add technician</button>{msg && <small>{msg}</small>}</form><div className="card">{rows.length ? <table><thead><tr><th>Name</th><th>Specialty</th><th>Phone</th><th>Status</th></tr></thead><tbody>
    {rows.map(t => <tr key={t.id}><td>{t.full_name}</td><td>{t.specialty}</td><td>{t.phone}</td><td><button className="btn ghost" onClick={() => toggle(t)}>{t.active ? 'Active' : 'Disabled'}</button></td></tr>)}</tbody></table>
    : <p className="empty">No technicians yet. Create a user, then set their role to technician (see README).</p>}</div></>
}
