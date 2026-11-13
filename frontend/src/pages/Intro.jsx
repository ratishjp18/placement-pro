import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api, fmtDate } from '../api'
import { useToast } from '../context'
import { Spinner } from '../components/ui'

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

  const rows = [
    ['Company', exam.company],
    ['Duration', `${exam.duration_minutes} minutes`],
    ['Questions', exam.question_count],
    ['Total marks', exam.total_marks],
    ['Negative marking', Number(exam.negative_marking) > 0 ? `${exam.negative_marking} × marks per wrong answer` : 'None'],
    ['Sections', exam.sections.map((s) => `${s.label} (${s.count})`).join(', ')],
  ]

  return (
    <div className="max-w-2xl mx-auto card p-7">
      <h1 className="page-title mb-4">{exam.title} — Instructions</h1>
      <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm mb-5">
        {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5 mb-6">
        <li>You get <strong>one attempt</strong>. The timer runs on the server and continues even if you refresh or close the page.</li>
        <li>Questions are numbered 1, 2, 3… in the palette. You can jump to any question, mark it for review and come back.</li>
        <li>The exam runs in fullscreen. Switching tabs or leaving fullscreen is logged as a violation.</li>
        <li>After <strong>{exam.max_violations} violations</strong> the exam is submitted automatically.</li>
        <li>Answers are saved automatically, and the exam is submitted when the time ends.</li>
      </ul>
      {exam.status === 'active' || exam.attempt ? (
        <button className="btn" onClick={start} disabled={busy}>
          {exam.attempt ? 'Resume exam' : 'I have read the instructions — Start exam'}
        </button>
      ) : (
        <p className="text-sm text-amber-700">
          This exam is not open right now (window: {fmtDate(exam.start_time)} – {fmtDate(exam.end_time)}).
        </p>
      )}
    </div>
  )
}
