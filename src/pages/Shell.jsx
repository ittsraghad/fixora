import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Users, ClipboardList, LogOut, Bell, UserRound, BarChart3 } from 'lucide-react'
import { useAuth } from '../auth'
import { supabase } from '../supabase'
const NAV = { resident: [['/app', LayoutDashboard, 'Overview'], ['/app/new', PlusCircle, 'New request']],
  admin: [['/admin', ClipboardList, 'Requests'], ['/admin/technicians', Users, 'Technicians'], ['/admin/reports', BarChart3, 'Reports']], technician: [['/tech', ClipboardList, 'My tasks']] }
const BASE = { resident: '/app', admin: '/admin', technician: '/tech' }
export default function Shell({ children }) {
  const { profile, signOut } = useAuth(), nav = useNavigate(), [unread, setUnread] = useState(0)
  useEffect(() => {
    const count = async () => { const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false); setUnread(count || 0) }
    count(); const ch = supabase.channel('n' + profile.id).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, count).subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile.id])
  const b = BASE[profile.role]
  return <div className="shell"><aside><span className="logo">Fix<i>ora</i></span>
    {NAV[profile.role].map(([to, I, t]) => <NavLink key={to} to={to} end><I size={18}/>{t}</NavLink>)}
    <NavLink to={`${b}/notifications`}><Bell size={18}/>Notifications{unread > 0 && <span className="badge" style={{ marginLeft: 'auto', background: 'var(--teal)', color: '#fff' }}>{unread}</span>}</NavLink>
    <NavLink to={`${b}/profile`}><UserRound size={18}/>My profile</NavLink>
    <button style={{ marginTop: 'auto' }} onClick={async () => { await signOut(); nav('/') }}><LogOut size={18}/>Log out</button></aside>
    <main>{children}</main></div>
}
