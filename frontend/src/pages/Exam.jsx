import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Icon, Logo, Spinner } from '../components/ui'

/**
 * The exam screen. The server owns the timer, the scoring and the violation count;
 * this component only displays the countdown (re-synced on every save) and reports events.
 */
export default function Exam() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [answers, setAnswers] = useState([]) // { selected, marked, visited } per question
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState(null)
  const [violations, setViolations] = useState(0)
  const [warn, setWarn] = useState('')
  const [gate, setGate] = useState(true)
  const [gateAgain, setGateAgain] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [reviewing, setReviewing] = useState(false) // final review page before submitting

  const endAt = useRef(0)
  const finished = useRef(false)
  const active = useRef(false)
  const lastEvent = useRef(0)
  const chain = useRef(Promise.resolve())

  // ---- load (a refresh restores answers and the remaining time from the server) ----
  useEffect(() => {
    api(`/attempts/${id}/`)
      .then((d) => {
        if (d.finished) { navigate(`/attempt/${id}/result`, { replace: true }); return }
        endAt.current = performance.now() + d.remaining * 1000
        setViolations(d.violations)
        setAnswers(d.questions.map((q) => ({ selected: q.selected, marked: q.marked, visited: q.selected !== null || q.marked })))
        setData(d)
      })
      .catch(() => navigate('/', { replace: true }))
  }, [id, navigate])

  // ---- server calls, serialised so saves arrive in order ----
  const post = (path, body) => {
    const p = chain.current.then(() => api(`/attempts/${id}/${path}/`, { method: 'POST', body })).catch(() => null)
    chain.current = p.then(() => {})
    return p
  }

  const leaveFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  const goToResult = () => {
    finished.current = true
    leaveFullscreen()
    navigate(`/attempt/${id}/result`, { replace: true })
  }

  const handle = (resp) => {
    if (!resp) return
    if (typeof resp.remaining === 'number') endAt.current = performance.now() + resp.remaining * 1000
    if (typeof resp.violations === 'number') setViolations(resp.violations)
    if (resp.finished) goToResult()
  }

  const submit = () => {
    if (finished.current) return
    finished.current = true
    leaveFullscreen()
    post('submit', {}).then(() => navigate(`/attempt/${id}/result`, { replace: true }))
  }

  // ---- countdown (display only) ----
  const submitRef = useRef(submit)
  submitRef.current = submit
  useEffect(() => {
    if (!data) return
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((endAt.current - performance.now()) / 1000))
      setLeft(s)
      if (s === 0) submitRef.current()
    }, 250)
    return () => clearInterval(t)
  }, [data])

  // ---- integrity: tab switches and fullscreen exits (the server counts and decides) ----
  useEffect(() => {
    const violation = (type, msg) => {
      if (!active.current || finished.current) return
      const now = Date.now()
      if (now - lastEvent.current < 1500) return // one physical action can fire several events
      lastEvent.current = now
      setWarn(msg + ' This has been logged.')
      post('violation', { type }).then(handle)
    }
    const onVisibility = () => { if (document.hidden) violation('tab_switch', 'You left the exam tab.') }
    const onFullscreen = () => {
      if (!document.fullscreenElement && active.current && !finished.current) {
        violation('fullscreen_exit', 'You exited fullscreen.')
        setGateAgain(true)
        setGate(true)
      }
    }
    const noMenu = (e) => e.preventDefault()
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('contextmenu', noMenu)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('contextmenu', noMenu)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
    } catch { /* some browsers refuse; the exam still continues */ }
    active.current = true
    setGate(false)
  }

  // ---- answers ----
  useEffect(() => {
    setAnswers((a) => (a[idx] && !a[idx].visited ? a.map((x, i) => (i === idx ? { ...x, visited: true } : x)) : a))
  }, [idx, data])

  if (!data) return <Spinner />
  const qs = data.questions
  const q = qs[idx]
  const cur = answers[idx] || {}

  const update = (patch) => {
    const next = { ...cur, ...patch }
    setAnswers((a) => a.map((x, i) => (i === idx ? next : x)))
    post('answer', { question: q.id, option: next.selected, marked: next.marked }).then(handle)
  }
  const go = (i) => { setReviewing(false); setIdx(Math.max(0, Math.min(qs.length - 1, i))) }
  const isLast = idx === qs.length - 1
  const next = () => (isLast ? setReviewing(true) : go(idx + 1))

  const count = { answered: 0, visited: 0, marked: 0, fresh: 0 }
  const status = (s) => {
    if (s.marked) { count.marked++; return 'marked' }
    if (s.selected !== null) { count.answered++; return 'answered' }
    if (s.visited) { count.visited++; return 'visited' }
    count.fresh++
    return ''
  }
  const palette = answers.map((s, i) => (
    <button key={i} className={`pal ${status(s)} ${i === idx ? 'current' : ''}`} onClick={() => go(i)}>{i + 1}</button>
  ))

  const mm = left === null ? '--' : String(Math.floor(left / 60)).padStart(2, '0')
  const ss = left === null ? '--' : String(left % 60).padStart(2, '0')
  const unanswered = answers.filter((s) => s.selected === null).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="card px-5 py-3 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Logo size={30} />
            <span className="hidden sm:block w-px h-6 bg-slate-200" />
            <span className="font-semibold truncate">{data.title}</span>
          </div>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${violations > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              <Icon name="shield" size={14} /> {violations}/{data.max_violations}
            </span>
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-lg font-bold ${left !== null && left <= 60 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-700'}`}>
              <Icon name="clock" size={17} /> {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
               style={{ width: `${((answers.length - unanswered) / Math.max(1, answers.length)) * 100}%` }} />
        </div>
      </div>
      {warn && <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">⚠ {warn}</div>}

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        {reviewing ? (
          <section className="card p-5">
            <h2 className="text-xl font-extrabold mb-1">Review your answers</h2>
            <p className="text-sm text-slate-500 mb-4">
              {answers.length - unanswered} answered · {unanswered} not answered · {count.marked} marked for review.
              Click a question to change its answer.
            </p>
            <div className="divide-y border rounded-lg mb-5">
              {qs.map((question, i) => {
                const a = answers[i]
                return (
                  <button key={question.id} onClick={() => go(i)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50">
                    <span className="w-7 h-7 shrink-0 rounded-md bg-slate-100 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 text-sm truncate">{question.text}</span>
                    {a.marked && <span className="badge badge-upcoming">Review</span>}
                    {a.selected !== null
                      ? <span className="badge badge-active">{String.fromCharCode(65 + a.selected)}. {question.options[a.selected].slice(0, 24)}</span>
                      : <span className="badge badge-draft">Not answered</span>}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => go(qs.length - 1)}>Back to questions</button>
              <button className="btn" onClick={() => setConfirming(true)}>Submit test</button>
            </div>
          </section>
        ) : (
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="badge badge-upcoming">{q.section_label}</span>
            <span className="text-sm text-slate-500">Question <strong className="text-slate-800">{idx + 1}</strong> of {qs.length} · {q.marks} mark(s)</span>
          </div>
          <p className="text-[1.15rem] font-medium leading-relaxed mb-6 whitespace-pre-wrap">{q.text}</p>
          <div className="space-y-2 mb-6">
            {q.options.map((text, pos) => (
              <button key={pos} className={`opt ${cur.selected === pos ? 'sel' : ''}`} onClick={() => update({ selected: pos })}>
                <span className="opt-letter">{String.fromCharCode(65 + pos)}</span><span>{text}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" disabled={idx === 0} onClick={() => go(idx - 1)}>Previous</button>
            <button className="btn btn-secondary" onClick={() => update({ selected: null })}>Clear answer</button>
            <button className="btn btn-secondary" onClick={() => { update({ marked: !cur.marked }); next() }}>
              {cur.marked ? 'Unmark review' : 'Mark for review'} &amp; {isLast ? 'review' : 'next'}
            </button>
            <button className="btn" onClick={next}>{isLast ? 'Review answers' : 'Save & next'}</button>
          </div>
        </section>
        )}

        <aside className="card p-4 h-fit lg:sticky lg:top-4">
          <div className="text-sm font-bold mb-3">Question palette</div>
          <div className="flex flex-wrap gap-1.5 mb-4">{palette}</div>
          <div className="text-xs text-slate-500 space-y-1 mb-4">
            <div><span className="pal answered inline-block align-middle" style={{ width: '.9rem', height: '.9rem' }} /> Answered ({count.answered})</div>
            <div><span className="pal visited inline-block align-middle" style={{ width: '.9rem', height: '.9rem' }} /> Not answered ({count.visited})</div>
            <div><span className="pal marked inline-block align-middle" style={{ width: '.9rem', height: '.9rem' }} /> Marked for review ({count.marked})</div>
            <div><span className="pal inline-block align-middle" style={{ width: '.9rem', height: '.9rem' }} /> Not visited ({count.fresh})</div>
          </div>
          <button className="btn w-full" onClick={() => setReviewing(true)}>Review &amp; submit</button>
        </aside>
      </div>

      {gate && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
            <div className="flex justify-center mb-4"><Logo size={40} /></div>
            <h2 className="text-xl font-extrabold mb-2">{gateAgain ? 'Return to fullscreen' : 'Ready to begin?'}</h2>
            <p className="text-sm text-slate-600 mb-4">
              The exam runs in fullscreen. Leaving fullscreen or switching tabs counts as a violation.
              The timer is already running on the server.
            </p>
            <button className="btn" onClick={enterFullscreen}>Enter fullscreen &amp; continue</button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-7 max-w-sm shadow-2xl">
            <h2 className="text-lg font-extrabold mb-2">Submit test?</h2>
            <p className="text-sm text-slate-600 mb-4">
              {unanswered} question(s) unanswered, {count.marked} marked for review. You cannot change answers after submitting.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Go back</button>
              <button className="btn" onClick={submit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
