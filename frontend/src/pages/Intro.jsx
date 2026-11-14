import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api, fmtDate } from '../api'
import { useToast } from '../context'
import { Icon, Spinner, Stepper } from '../components/ui'

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

  const rules = [
    ['clock', <>You get <strong>one attempt</strong>. The timer runs on the server and keeps going even if you refresh or close the page.</>],
    ['list', <>Questions appear <strong>one per page</strong>. Use the numbered strip to jump to any question.</>],
    ['shield', <>The test runs in <strong>fullscreen</strong>. Switching tabs or leaving fullscreen is a violation. After <strong>{exam.max_violations}</strong> the test is submitted automatically.</>],
    ['eye', <>Keep your <strong>camera on</strong> and your face in view. Your face going missing, a second person appearing, or the camera being turned off is also a violation. Video is analysed on your device and never uploaded.</>],
    ['check', <>Answers save automatically. At the end you will <strong>review all answers</strong> before submitting. The test also submits when time ends.</>],
  ]
  const details = [
    ['Company', exam.company],
    ['Duration', `${exam.duration_minutes} minutes`],
    ['Questions', exam.question_count],
    ['Total marks', exam.total_marks],
  ]
  const open = exam.status === 'active' || exam.attempt

  return (
    <>
      <div className="mb-6"><Stepper current={0} /></div>
      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        <section className="card p-7 sm:p-9">
          <div className="text-xs font-bold uppercase tracking-[.14em] text-teal-700 mb-2">Before you begin</div>
          <h1 className="page-title mb-6">{exam.title}</h1>
          <ul className="space-y-5">
            {rules.map(([ic, text], i) => (
              <li key={i} className="flex gap-4 text-[15px] text-stone-700 leading-relaxed">
                <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><Icon name={ic} size={18} /></span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="card overflow-hidden lg:sticky lg:top-6">
          <div className="bg-teal-900 text-white px-6 py-5">
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-teal-300/80">Test details</div>
            <div className="font-extrabold text-lg leading-snug mt-1">{exam.title}</div>
          </div>
          <dl className="px-6 py-4 text-sm divide-y divide-stone-100">
            {details.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5"><dt className="text-stone-500">{k}</dt><dd className="font-bold">{v}</dd></div>
            ))}
            <div className="py-3">
              <dt className="text-stone-500 mb-2">Sections</dt>
              <dd className="flex flex-wrap gap-1.5">
                {exam.sections.map((s) => <span key={s.label} className="badge badge-upcoming">{s.label} · {s.count}</span>)}
              </dd>
            </div>
          </dl>
          <div className="px-6 pb-6">
            {open ? (
              <button className="btn btn-accent btn-lg w-full" onClick={start} disabled={busy}>
                {exam.attempt ? 'Resume test' : 'Start test'} <Icon name="arrow" size={16} />
              </button>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3">
                Not open right now. Window: {fmtDate(exam.start_time)} – {fmtDate(exam.end_time)}.
              </p>
            )}
            <p className="text-[11px] text-stone-400 text-center mt-3">By starting you agree to the rules on the left.</p>
          </div>
        </aside>
      </div>
    </>
  )
}
