import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, SECTIONS } from '../../api'
import { useToast } from '../../context'
import { Field, Spinner } from '../../components/ui'

const blank = {
  title: '', duration_minutes: 30, negative_marking: '0.25', start_time: '', end_time: '', is_published: true,
  count_quant: 8, count_logical: 8, count_verbal: 7, count_technical: 7,
}

export default function ExamForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState(id ? null : blank)
  const [locked, setLocked] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    api(`/company/exams/${id}/`).then((e) => {
      setLocked(e.locked)
      setF({
        title: e.title, duration_minutes: e.duration_minutes, negative_marking: e.negative_marking,
        start_time: e.start_input, end_time: e.end_input, is_published: e.is_published,
        ...Object.fromEntries(SECTIONS.map((s) => [`count_${s.value}`, e.counts[s.value]])),
      })
    })
  }, [id])

  if (!f) return <Spinner />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      await api(id ? `/company/exams/${id}/` : '/company/exams/', { method: id ? 'PUT' : 'POST', body: f })
      toast('Exam saved.')
      navigate('/company/exams')
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto card p-7">
      <h1 className="page-title mb-5">{id ? 'Edit exam' : 'Create exam'}</h1>
      <form onSubmit={submit} className="space-y-4">
        {(errors.__all__ || []).map((m, i) => <p key={i} className="err bg-red-50 border border-red-200 rounded-lg px-3 py-2">{m}</p>)}
        <Field label="Title" error={errors.title}><input value={f.title} onChange={set('title')} required /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration (minutes)" error={errors.duration_minutes}>
            <input type="number" min="1" value={f.duration_minutes} onChange={set('duration_minutes')} required />
          </Field>
          <Field label="Negative marking (fraction, 0 = off)" error={errors.negative_marking}>
            <input type="number" step="0.01" min="0" value={f.negative_marking} onChange={set('negative_marking')} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start time" error={errors.start_time}><input type="datetime-local" value={f.start_time} onChange={set('start_time')} required /></Field>
          <Field label="End time" error={errors.end_time}><input type="datetime-local" value={f.end_time} onChange={set('end_time')} required /></Field>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Random questions per section</div>
          {locked && <p className="text-xs text-amber-700 mb-2">Students have already started, so the question set can no longer change.</p>}
          <div className="grid grid-cols-2 gap-4">
            {SECTIONS.map((s) => (
              <Field key={s.value} label={s.label} error={errors[`count_${s.value}`]}>
                <input type="number" min="0" value={f[`count_${s.value}`]} onChange={set(`count_${s.value}`)} disabled={locked} />
              </Field>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={f.is_published} onChange={set('is_published')} /> Published (students can see and take it)
        </label>
        <div className="flex gap-2 pt-2">
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
