// Usage: SUPABASE_URL=... SERVICE_KEY=... node scripts/seed-demo-users.mjs
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SUPABASE_URL, process.env.SERVICE_KEY, { auth: { persistSession: false } })
const PW = 'Demo12345!'
const users = [['admin@fixora.demo','Layla Admin','admin',null],['resident@fixora.demo','Raghad Alharbi','resident',null],
  ['tech@fixora.demo','Ahmed Technician','technician','Plumbing'],['tech2@fixora.demo','Omar Saleh','technician','Electrical'],['tech3@fixora.demo','Khaled Nasser','technician','AC']]
for (const [email, full_name, role, specialty] of users) {
  const { data, error } = await sb.auth.admin.createUser({ email, password: PW, email_confirm: true, user_metadata: { full_name } })
  if (error) { console.log('skip', email, error.message); continue }
  await sb.from('profiles').update({ role, specialty, email }).eq('id', data.user.id); console.log('created', email, role)
}
console.log('Password for all:', PW)
