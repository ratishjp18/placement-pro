import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, SECTIONS } from '../../api'
import { useToast } from '../../context'
import { Field, Spinner } from '../../components/ui'

const blank = {
  section: 'quant', topic: '', difficulty: 'medium', marks: 1, text: '',
  option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', is_active: true,
}

export default function QuestionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState(id ? null : blank)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (id) api(`/company/questions/${id}/`).then(setF) }, [id])
  if (!f) return <Spinner />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      await api(id ? `/company/questions/${id}/` : '/company/questions/', { method: id ? 'PUT' : 'POST', body: f })
      toast('Question saved.')
      navigate('/company/questions')
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors)
    } finally {
      setBusy(false)
    }
  }

  // Two columns so the whole form fits on one screen (no scrolling).
  return (
    <div className="max-w-5xl card p-6">
      <h1 className="page-title mb-4">{id ? 'Edit question' : 'Add question'}</h1>
      <form onSubmit={submit}>
        <div className="grid lg:grid-cols-2 gap-x-6 gap-y-3">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Section" error={errors.section}>
                <select value={f.section} onChange={set('section')}>{SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              </Field>
              <Field label="Topic" error={errors.topic}><input value={f.topic} onChange={set('topic')} /></Field>
              <Field label="Difficulty" error={errors.difficulty}>
                <select value={f.difficulty} onChange={set('difficulty')}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </Field>
              <Field label="Marks" error={errors.marks}><input type="number" step="0.5" min="0.5" value={f.marks} onChange={set('marks')} required /></Field>
            </div>
            <Field label="Question" error={errors.text}><textarea rows="6" value={f.text} onChange={set('text')} required /></Field>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {['a', 'b', 'c', 'd'].map((l) => (
                <Field key={l} label={`Option ${l.toUpperCase()}`} error={errors[`option_${l}`]}>
                  <textarea rows="2" value={f[`option_${l}`]} onChange={set(`option_${l}`)} required />
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Correct option" error={errors.correct_option}>
                <select value={f.correct_option} onChange={set('correct_option')}>{['A', 'B', 'C', 'D'].map((l) => <option key={l}>{l}</option>)}</select>
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold pb-2.5">
                <input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Active
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-4 mt-4 border-t border-stone-100">
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
