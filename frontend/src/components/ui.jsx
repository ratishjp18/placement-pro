import { useId } from 'react'

/* ------------------------------------------------------------------ logo */

/** Logo concepts. Open /logos to compare them all.
 * `boxed: false` marks are free-standing (no rounded-square badge).
 */
export const LOGO_VARIANTS = {
  pmono: { boxed: true, desc: 'Solid letter P with an amber dot (your pick, now in use)' },
  pencil: { boxed: false, desc: 'A pencil drawing a check mark: the test, passed' },
  typo: { boxed: false, desc: 'Lettering where the "o" in Pro is a filled answer bubble' },
  plane: { boxed: false, desc: 'Paper plane: sending off your application' },
  spark: { boxed: false, desc: 'Sparkle: shortlisted' },
  ribbonp: { boxed: false, desc: 'Letter P folded from a ribbon' },
  door: { boxed: false, desc: 'An open door: the opportunity' },
  bubbles: { boxed: true, desc: 'Answer bubbles in a badge' },
  qcheck: { boxed: true, desc: 'Question mark turning into a check, in a badge' },
  rings: { boxed: true, desc: 'Meeting rings in a badge' },
}

/* ---- free-standing marks: `m` is the main colour (teal, or white on dark), `a` is amber ---- */
function FreeArt({ variant, m, a }) {
  switch (variant) {
    case 'pencil':
      return (
        <>
          {/* the check mark the pencil has just drawn */}
          <path d="M6 30l8 8L29 21" fill="none" stroke={m} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* the pencil, tip resting at the end of the check */}
          <g transform="translate(4 -12) rotate(45 25 34)">
            <rect x="21.5" y="11" width="7" height="4.5" rx="1.5" fill={m} />
            <rect x="21.5" y="15.5" width="7" height="10.5" fill={a} />
            <polygon points="21.5,26 28.5,26 25,34" fill="#fde68a" />
            <polygon points="24,31.3 26,31.3 25,34" fill={m} />
          </g>
        </>
      )
    case 'plane':
      return (
        <>
          <path d="M6 22L43 6 31 42 23 28z" fill={m} />
          <path d="M23 28L43 6 27 26z" fill={a} />
          <path d="M5 40c7-1 12-5 15-12" fill="none" stroke={a} strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 6" />
        </>
      )
    case 'spark': {
      const star = 'M24 4C25.5 15 33 22.5 44 24 33 25.5 25.5 33 24 44 22.5 33 15 25.5 4 24 15 22.5 22.5 15 24 4Z'
      return (
        <>
          <path d={star} fill={m} />
          <path d={star} fill={a} transform="translate(30 0) scale(.34)" />
          <path d={star} fill={a} transform="translate(2 33) scale(.24)" />
        </>
      )
    }
    case 'ribbonp':
      return (
        <>
          <rect x="12" y="8" width="10" height="33" rx="1.5" fill={m} />
          <path d="M22 13.5h7a8 8 0 0 1 0 16h-7" fill="none" stroke={m} strokeWidth="8" />
          <polygon points="12,41 22,41 22,32" fill={a} />
        </>
      )
    case 'door':
      return (
        <>
          <rect x="14" y="8" width="21" height="34" rx="2" fill="#fde68a" />
          <path d="M11 42V10a2 2 0 0 1 2-2h23a2 2 0 0 1 2 2v32" fill="none" stroke={m} strokeWidth="3.2" strokeLinecap="round" />
          <polygon points="14,8 27,12 27,39 14,42" fill={m} />
          <circle cx="24.2" cy="26" r="1.5" fill={a} />
          <line x1="6" y1="42" x2="42" y2="42" stroke={m} strokeWidth="3.2" strokeLinecap="round" />
        </>
      )
    default: // typo: the filled answer bubble that becomes the "o"
      return (
        <>
          <circle cx="24" cy="24" r="19" fill={a} />
          <path d="M15 24.5l6.5 6.5L33.5 17" fill="none" stroke="#134e4a" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
  }
}

/* ---- badge marks (white shapes on a teal rounded square) ---- */
function BoxArt({ variant, uid }) {
  switch (variant) {
    case 'pmono':
      return (
        <>
          <path fillRule="evenodd" fill="#fff" d="M15 9h12.5a9.5 9.5 0 0 1 0 19H22v11h-7z M22 16v5h5.5a2.5 2.5 0 0 0 0-5z" />
          <circle cx="35.5" cy="37" r="3.2" fill="#fbbf24" />
        </>
      )
    case 'qcheck':
      return (
        <>
          <path d="M16 18a8 8 0 1 1 11.9 7c-2.4 1.4-3.9 2.5-3.9 5" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.6 38.4l3 3.1 5.6-6.4" fill="none" stroke="#fbbf24" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case 'rings':
      return (
        <>
          <defs><clipPath id={`${uid}c`}><circle cx="18.5" cy="24" r="11" /></clipPath></defs>
          <circle cx="29.5" cy="24" r="11" fill="#fbbf24" clipPath={`url(#${uid}c)`} />
          <circle cx="18.5" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="3.2" />
          <circle cx="29.5" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="3.2" />
        </>
      )
    default: // bubbles
      return (
        <>
          <circle cx="16.5" cy="16.5" r="6" fill="none" stroke="#fff" strokeWidth="2.8" />
          <circle cx="31.5" cy="16.5" r="6" fill="none" stroke="#fff" strokeWidth="2.8" />
          <circle cx="16.5" cy="31.5" r="6" fill="none" stroke="#fff" strokeWidth="2.8" />
          <circle cx="31.5" cy="31.5" r="7.4" fill="#fbbf24" />
          <path d="M27.8 31.7l2.7 2.7 4.9-5.4" fill="none" stroke="#134e4a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
  }
}

export function LogoMark({ size = 36, variant = 'pmono', light = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const boxed = LOGO_VARIANTS[variant]?.boxed
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      {boxed ? (
        <>
          <defs>
            <linearGradient id={`${uid}g`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0f766e" /><stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="14" fill={`url(#${uid}g)`} />
          <BoxArt variant={variant} uid={uid} />
        </>
      ) : (
        <FreeArt variant={variant} m={light ? '#ffffff' : '#0f766e'} a="#f59e0b" />
      )}
    </svg>
  )
}

/** Mark + wordmark. `light` is for dark backgrounds. */
export function Logo({ size = 36, light = false, variant = 'pmono' }) {
  const text = light ? 'text-white' : 'text-stone-900'
  const fs = size * 0.56
  if (variant === 'typo') {
    // lettering only: "PlacementPr" + the answer bubble as the final "o"
    return (
      <span className={`inline-flex items-center font-extrabold leading-none select-none ${text}`} style={{ fontSize: fs * 1.15, letterSpacing: '-0.035em' }}>
        Placement
        <span className={light ? 'text-amber-300' : 'text-teal-700'}>Pr</span>
        <svg viewBox="0 0 48 48" width="0.86em" height="0.86em" className="ml-[0.02em]" aria-hidden="true">
          <FreeArt variant="typo" m="#0f766e" a="#f59e0b" />
        </svg>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <LogoMark size={size} variant={variant} light={light} />
      <span className={`inline-flex items-center gap-1.5 font-extrabold leading-none ${text}`} style={{ fontSize: fs, letterSpacing: '-0.03em' }}>
        Placement
        <span className="rounded-md bg-amber-400 text-stone-900 font-extrabold"
              style={{ fontSize: size * 0.32, padding: `${size * 0.07}px ${size * 0.12}px`, letterSpacing: '0.06em' }}>
          PRO
        </span>
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
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
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
      <div className="w-8 h-8 rounded-full border-[3px] border-teal-100 border-t-teal-700 animate-spin" />
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}><i className="dot" />{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

const TONES = {
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  stone: 'bg-stone-100 text-stone-600',
  rose: 'bg-rose-50 text-rose-600',
}

/** Stat tile with a coloured icon. */
export function StatTile({ icon, label, value, tone = 'teal' }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${TONES[tone]}`}><Icon name={icon} size={20} /></div>
      <div>
        <div className="text-2xl font-extrabold leading-none">{value}</div>
        <div className="text-xs text-stone-500 mt-1">{label}</div>
      </div>
    </div>
  )
}

/** Student progress: Instructions → Test → Review → Submitted. `current` is 0-3. */
export function Stepper({ current }) {
  const steps = ['Instructions', 'Test', 'Review', 'Submitted']
  return (
    <ol className="flex items-center gap-2 text-xs font-bold">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
            i < current ? 'bg-teal-700 text-white' : i === current ? 'bg-amber-400 text-stone-900' : 'bg-stone-200 text-stone-500'}`}>
            {i < current ? '✓' : i + 1}
          </span>
          <span className={i === current ? 'text-stone-900' : 'text-stone-400'}>{s}</span>
          {i < steps.length - 1 && <span className="w-6 h-px bg-stone-300" />}
        </li>
      ))}
    </ol>
  )
}
