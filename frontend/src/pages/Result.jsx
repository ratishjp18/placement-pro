import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Icon, Spinner, Stepper } from '../components/ui'

/** Students are only told how many questions they attended, never what was right or wrong. */
export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [r, setR] = useState(null)

  useEffect(() => { api(`/attempts/${id}/result/`).then(setR).catch(() => navigate('/')) }, [id, navigate])

  if (!r) return <Spinner />
  if (!r.finished) return <Navigate to={`/attempt/${id}`} replace />

  const pct = r.total > 0 ? Math.round((r.attended / r.total) * 100) : 0

  return (
    <>
      <div className="mb-6"><Stepper current={3} /></div>
      <div className="max-w-2xl mx-auto card overflow-hidden text-center">
        <div className="bg-teal-900 text-white px-8 py-10">
          <div className="w-14 h-14 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center mx-auto mb-4">
            <Icon name="check" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold">Test submitted</h1>
          <p className="text-teal-100/80 text-sm mt-1">{r.title}</p>
        </div>
        <div className="px-8 py-9">
          <div className="text-6xl font-extrabold tracking-tight">
            {r.attended}<span className="text-3xl text-stone-300"> / {r.total}</span>
          </div>
          <div className="text-stone-500 mt-1 mb-5">questions attended</div>
          <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden max-w-xs mx-auto mb-2">
            <div className="h-full bg-teal-600 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs font-bold text-teal-700 mb-6">{pct}% attended</div>
          <p className="text-sm text-stone-400">Your answers have been sent to the company. Thank you for taking the test.</p>
        </div>
      </div>
    </>
  )
}
