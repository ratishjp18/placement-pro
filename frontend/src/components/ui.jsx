import { useId } from 'react'

/* ------------------------------------------------------------------ logo */

/** The PlacementPro mark: a "P" whose bowl holds a check mark (a passed test). */
export function LogoMark({ size = 36 }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" /><stop offset="1" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#${id})`} />
      <path d="M17 36V13h9.5a7.5 7.5 0 0 1 0 15H17" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 20.5l2.8 2.8 5-5.6" fill="none" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Mark + wordmark. `light` is for dark backgrounds. */
export function Logo({ size = 36, light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <LogoMark size={size} />
      <span className={`font-extrabold tracking-tight leading-none ${light ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: size * 0.52 }}>
        Placement<span className={light ? 'text-amber-200' : 'text-gradient'}>Pro</span>
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ icons */

const ICONS = {
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  minus: '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
}

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

/* ------------------------------------------------------------------ misc */

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
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 rounded-full border-[3px] border-indigo-200 border-t-indigo-600 animate-spin" />
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}><i className="dot" />{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
}

/** Stat tile with a coloured icon. */
export function StatTile({ icon, label, value, tone = 'indigo' }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${TONES[tone]}`}><Icon name={icon} size={20} /></div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  )
}
