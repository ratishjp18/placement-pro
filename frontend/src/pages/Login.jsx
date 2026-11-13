import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { Icon, Logo } from '../components/ui'

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="auth-bg" />
      <div className="grid md:grid-cols-[1.05fr_1fr] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 border border-white/60 bg-white rise">
        <div className="hidden md:flex flex-col justify-between p-10 text-white relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-fuchsia-400/20" />
          <div className="relative"><Logo size={40} light /></div>
          <div className="relative">
            <h2 className="text-[2rem] font-extrabold leading-[1.15] mb-3">Your campus placement test, made simple.</h2>
            <p className="text-indigo-100 text-sm mb-7 max-w-sm">Take timed aptitude tests from companies visiting your campus and see your rank the moment you finish.</p>
            <ul className="space-y-3 text-sm">
              {[['clock', 'Timed tests with a live countdown'], ['shield', 'Auto-saved answers, safe on refresh'], ['award', 'Instant score, sections and rank']].map(([ic, t]) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center"><Icon name={ic} size={16} /></span>{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex gap-2 flex-wrap text-[11px] font-semibold">
            {['Quantitative', 'Logical', 'Verbal', 'Technical'].map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-full bg-white/15">{s}</span>
            ))}
          </div>
        </div>
        <div className="p-8 md:p-11 flex flex-col justify-center">
          <div className="md:hidden mb-6"><Logo size={36} /></div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[1.7rem] font-extrabold tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm text-slate-500 mb-7">Sign in with your email and password.</p>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">{error}</p>}
        <div className="field">
          <label className="lbl">Email</label>
          <input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="lbl">Password</label>
          <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <Icon name="arrow" size={16} /></>}</button>
      </form>
      <div className="mt-7 pt-5 border-t text-sm text-slate-600">
        New student? <Link className="link" to="/register">Create an account</Link>
      </div>
    </AuthShell>
  )
}
