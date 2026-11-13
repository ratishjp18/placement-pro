/** Small shared bits: labelled field with server-side error text. */
export function Field({ label, error, children }) {
  return (
    <div className="field">
      {label && <label className="lbl">{label}</label>}
      {children}
      {(error || []).map((e, i) => <p key={i} className="err">{e}</p>)}
    </div>
  )
}

export function Spinner() {
  return <div className="text-center text-slate-500 py-16 text-sm">Loading…</div>
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}
