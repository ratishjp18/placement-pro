import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useToast } from '../context'
import { Field } from '../components/ui'

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      await api('/auth/register/', { method: 'POST', body: { email, password } })
      // Not logged in automatically: show a message and send them to the login page.
      toast('Account created successfully. Please log in.')
      navigate('/login')
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 py-8">
      <div className="auth-bg" />
      <div className="max-w-md mx-auto mt-10 card shadow-xl p-8">
        <div className="flex items-center gap-2 font-bold mb-6">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">P</span> PlacementPro
        </div>
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">All you need is an email and a password.</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" error={errors.email}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button className="btn w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="text-sm mt-5 text-slate-600">Already registered? <Link className="link" to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
