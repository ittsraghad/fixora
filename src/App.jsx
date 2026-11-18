import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import Landing from './pages/Landing'
import { Login, Signup } from './pages/Auth'
import Shell from './pages/Shell'
import { ResidentHome, CreateRequest } from './pages/Resident'
import RequestDetails from './pages/RequestDetails'
import { AdminHome, AdminTechnicians } from './pages/Admin'
import TechHome from './pages/Tech'
import { Notifications, Profile, Reports } from './pages/Extras'
const home = { admin: '/admin', technician: '/tech', resident: '/app' }
function Guard({ role, children }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="center">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== role) return <Navigate to={home[profile.role]} replace />
  return <Shell>{children}</Shell>
}
export default function App() {
  const G = (role, el) => <Guard role={role}>{el}</Guard>
  return <Routes>
    <Route path="/" element={<Landing/>} /><Route path="/login" element={<Login/>} /><Route path="/signup" element={<Signup/>} />
    <Route path="/app" element={G('resident', <ResidentHome/>)} />
    <Route path="/app/new" element={G('resident', <CreateRequest/>)} />
    <Route path="/app/requests/:id" element={G('resident', <RequestDetails/>)} />
    <Route path="/admin" element={G('admin', <AdminHome/>)} />
    <Route path="/admin/technicians" element={G('admin', <AdminTechnicians/>)} />
    <Route path="/admin/requests/:id" element={G('admin', <RequestDetails/>)} />
    <Route path="/tech" element={G('technician', <TechHome/>)} />
    <Route path="/tech/requests/:id" element={G('technician', <RequestDetails/>)} />
    <Route path="/app/notifications" element={G('resident', <Notifications/>)} />
    <Route path="/app/profile" element={G('resident', <Profile/>)} />
    <Route path="/admin/notifications" element={G('admin', <Notifications/>)} />
    <Route path="/admin/profile" element={G('admin', <Profile/>)} />
    <Route path="/tech/notifications" element={G('technician', <Notifications/>)} />
    <Route path="/tech/profile" element={G('technician', <Profile/>)} />
    <Route path="/admin/reports" element={G('admin', <Reports/>)} />
    <Route path="*" element={<div className="center"><div style={{textAlign:'center'}}><h2>Page not found</h2><a className="btn" href="/">Back home</a></div></div>} />
  </Routes>
}
