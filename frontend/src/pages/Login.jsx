import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'

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
    <div className="px-4 py-8">
      <div className="auth-bg" />
      <div className="grid md:grid-cols-2 max-w-4xl mx-auto mt-6 md:mt-12 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
        <div className="hidden md:flex flex-col justify-between p-10 text-white bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">P</span> PlacementPro
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-3">Your campus placement test, made simple.</h2>
            <p className="text-indigo-100 text-sm mb-6">Take timed aptitude tests from companies visiting your campus and see your rank instantly.</p>
            <ul className="space-y-2 text-sm text-indigo-50">
              <li>✓ Timed tests with a live countdown</li>
              <li>✓ Auto-saved answers, even if you refresh</li>
              <li>✓ Instant score, section breakdown and rank</li>
            </ul>
          </div>
          <p className="text-xs text-indigo-200">Quantitative · Logical · Verbal · Technical</p>
        </div>

        <div className="p-8 md:p-10">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in with your email and password.</p>
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="field">
              <label className="lbl">Email</label>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="mt-6 pt-5 border-t text-sm text-slate-600">
            New student? <Link className="link" to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
