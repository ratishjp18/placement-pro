import { Logo, LogoMark, LOGO_VARIANTS } from '../components/ui'

/** Logo options. Open /logos to compare them, then pick a number. */
export default function Logos() {
  const entries = Object.entries(LOGO_VARIANTS)
  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="page-title mb-1">Logo options</h1>
      <p className="text-stone-500 text-sm mb-8">Pick a number. Option 1 is the one currently in use.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {entries.map(([key, { desc }], i) => (
          <div key={key} className="card overflow-hidden">
            <div className="p-6 flex items-center justify-center gap-5 border-b border-stone-100 min-h-[7rem]">
              {key !== 'typo' && <LogoMark size={72} variant={key} />}
              {key !== 'typo' && <LogoMark size={36} variant={key} />}
              {key !== 'typo' && <LogoMark size={20} variant={key} />}
              {key === 'typo' && <Logo size={64} variant={key} />}
            </div>
            <div className="p-5 min-h-[5rem] flex items-center"><Logo size={40} variant={key} /></div>
            <div className="bg-teal-900 p-5 min-h-[5rem] flex items-center"><Logo size={36} light variant={key} /></div>
            <div className="px-5 py-4 text-sm"><strong>Option {i + 1}</strong> <span className="text-stone-500">· {desc}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
