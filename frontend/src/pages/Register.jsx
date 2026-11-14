import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useToast } from '../context'
import { Field, Icon, PasswordInput } from '../components/ui'
import { AuthShell } from './Login'

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
    <AuthShell>
      <h1 className="text-[2.6rem] font-extrabold tracking-tight leading-[1.05] mb-2">Create your account</h1>
      <p className="text-base text-stone-500 mb-8">All you need is an email and a password.</p>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email" error={errors.email}>
          <input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput required placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? 'Creating…' : <>Create account <Icon name="arrow" size={16} /></>}</button>
      </form>
      <p className="text-base mt-8 text-stone-600">Already registered? <Link className="link" to="/login">Sign in</Link></p>
    </AuthShell>
  )
}
