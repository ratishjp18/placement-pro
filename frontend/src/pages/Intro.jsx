import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api, fmtDate } from '../api'
import { useToast } from '../context'
import { Icon, Spinner } from '../components/ui'

export default function Intro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [exam, setExam] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { api(`/student/exams/${id}/`).then(setExam).catch(() => navigate('/')) }, [id, navigate])

  if (!exam) return <Spinner />
  if (exam.attempt?.submitted) return <Navigate to={`/attempt/${exam.attempt.id}/result`} replace />

  const start = async () => {
    setBusy(true)
    try {
      const d = await api(`/student/exams/${id}/start/`, { method: 'POST' })
      navigate(`/attempt/${d.attempt_id}`)
    } catch (err) {
      toast(err.message, 'error')
      setBusy(false)
    }
  }

  const tiles = [
    ['clock', 'Duration', `${exam.duration_minutes} min`, 'bg-indigo-50 text-indigo-600'],
    ['list', 'Questions', exam.question_count, 'bg-violet-50 text-violet-600'],
    ['award', 'Total marks', exam.total_marks, 'bg-emerald-50 text-emerald-600'],
  ]
  const rules = [
    ['check', <>You get <strong>one attempt</strong>. The timer runs on the server and keeps going even if you refresh or close the page.</>],
    ['list', <>Questions appear <strong>one per page</strong>. Use the numbered palette to jump to any question.</>],
    ['shield', <>The test runs in <strong>fullscreen</strong>. Switching tabs or leaving fullscreen is a violation. After <strong>{exam.max_violations}</strong> the test is submitted automatically.</>],
    ['check', <>Answers save automatically. At the end you will <strong>review all answers</strong> before submitting. The test also submits when time ends.</>],
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card overflow-hidden">
        <div className="px-8 py-7 text-white bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 relative overflow-hidden">
          <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="relative">
            <div className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">{exam.company} · Instructions</div>
            <h1 className="text-2xl font-extrabold">{exam.title}</h1>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-3 mb-7">
            {tiles.map(([ic, label, value, tone]) => (
              <div key={label} className="rounded-2xl border border-slate-200 p-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${tone}`}><Icon name={ic} size={18} /></div>
                <div className="text-lg font-bold leading-none">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sections</div>
            <div className="flex flex-wrap gap-2">
              {exam.sections.map((s) => (
                <span key={s.label} className="px-3 py-1.5 rounded-full bg-slate-100 text-sm font-medium">{s.label} <span className="text-slate-400">· {s.count}</span></span>
              ))}
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Read before you begin</div>
          <ul className="space-y-3 mb-8">
            {rules.map(([ic, text], i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="w-6 h-6 mt-0.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Icon name={ic} size={13} /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {exam.status === 'active' || exam.attempt ? (
            <button className="btn btn-lg" onClick={start} disabled={busy}>
              {exam.attempt ? 'Resume test' : 'I have read the instructions — Start test'} <Icon name="arrow" size={16} />
            </button>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              This test is not open right now (window: {fmtDate(exam.start_time)} – {fmtDate(exam.end_time)}).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
