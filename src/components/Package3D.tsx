import { useEffect, useRef, useState } from 'react';
import { RotateCw, Pause, Grid3X3, Hand } from 'lucide-react';

interface Hotspot {
  id: string;
  label: string;
  rule: string;
  desc: string;
  x: number;
  y: number;
}

const HOTSPOTS: Hotspot[] = [
  { id: 'mrp', label: 'MRP ₹ 145.00', rule: 'Rule 6(1) · R-04 · Critical', desc: 'Maximum Retail Price, inclusive of all taxes, in ₹. No sticker may conceal or raise the printed MRP.', x: 68, y: 20 },
  { id: 'qty', label: 'Net Qty 500 g', rule: 'Sec 3, LM Act · R-03 · Critical', desc: 'Net contents excluding packaging, in metric units only — g, kg, ml, L. "1 pound" style declarations are offences.', x: 68, y: 40 },
  { id: 'mfg', label: 'Maker + Address', rule: 'Rule 6(1) · R-02 · Critical', desc: 'Name and complete address of the manufacturer, packer or importer — the legally responsible person.', x: 68, y: 58 },
  { id: 'mfd', label: 'MFD 06/2026', rule: 'Rule 6(1) · R-06 · High', desc: 'Month and year of manufacture, packing or import. Best-before alone does not satisfy this.', x: 68, y: 74 },
  { id: 'care', label: 'Consumer Care', rule: 'Rule 6 · R-07 · High', desc: 'Name, address and phone/e-mail where a consumer can lodge a complaint about the package.', x: 30, y: 84 },
  { id: 'usp', label: 'USP ₹290/kg', rule: 'USP norms · R-05 · Medium', desc: 'Unit Sale Price per kg for scheduled classes, so a shopper can compare value across pack sizes.', x: 30, y: 20 },
];

export default function Package3D() {
  const [rotY, setRotY] = useState(-24);
  const [rotX, setRotX] = useState(8);
  const [auto, setAuto] = useState(true);
  const [grid, setGrid] = useState(true);
  const [active, setActive] = useState<Hotspot>(HOTSPOTS[0]);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setRotY((r) => (r + 0.5) % 360), 40);
    return () => clearInterval(t);
  }, [auto]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    setAuto(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setRotY((r) => r + (e.clientX - drag.current!.x) * 0.4);
    setRotX((r) => Math.max(-30, Math.min(30, r - (e.clientY - drag.current!.y) * 0.3)));
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag.current = null; };

  const face = 'absolute flex flex-col overflow-hidden rounded-sm border border-[#d8cfba]';

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div
          className="relative mx-auto h-[380px] w-full max-w-[440px] cursor-grab select-none active:cursor-grabbing sm:h-[440px]"
          style={{ perspective: '1200px' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <div className="absolute left-1/2 top-1/2 h-[330px] w-[220px] sm:h-[380px] sm:w-[250px]" style={{ transformStyle: 'preserve-3d', transform: `translate(-50%,-50%) rotateX(${rotX}deg) rotateY(${rotY}deg)` }}>
            {/* front */}
            <div className={`${face} inset-0 bg-[#f3ead3]`} style={{ transform: 'translateZ(70px)', position: 'absolute', inset: 0 }}>
              <div className="bg-[#123a7a] px-4 pb-3 pt-4 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#e8c877]">Malabar</p>
                <p className="mt-1 font-display text-[19px] font-semibold leading-tight text-white">Premium Basmati Rice</p>
              </div>
              <div className="relative flex-1 px-4 py-3">
                {grid && (
                  <div className="pointer-events-none absolute inset-2 rounded-sm border-2 border-dashed border-[#b98a2e]/70">
                    <span className="absolute -top-2 left-2 bg-[#b98a2e] px-1.5 text-[8px] font-bold uppercase tracking-widest text-white">Principal Display Panel</span>
                  </div>
                )}
                <div className="mt-5 flex items-center justify-center gap-2">
                  <div className="h-16 w-12 rounded-sm bg-gradient-to-b from-[#e9d9ae] to-[#cbb37e] shadow-inner" />
                  <div className="h-16 w-12 rounded-sm bg-gradient-to-b from-[#dcc48f] to-[#b89b5e] shadow-inner" />
                  <div className="h-16 w-12 rounded-sm bg-gradient-to-b from-[#e9d9ae] to-[#cbb37e] shadow-inner" />
                </div>
                <div className="mt-3 rounded-sm bg-[#101828] px-2 py-1.5 text-center">
                  <p className="text-[11px] font-bold tracking-wide text-white">MRP ₹ 145.00 <span className="font-normal text-slate-300">(incl. of all taxes)</span></p>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-sm border border-[#123a7a]/30 bg-white/70 px-2 py-1.5">
                  <p className="text-[11px] font-bold text-[#123a7a]">Net Qty 500 g</p>
                  <p className="text-[9px] font-semibold text-slate-600">USP ₹290/kg</p>
                </div>
                <p className="mt-2 text-center text-[9px] font-semibold text-slate-600">MFD 06/2026 · Care 1800-266-7788</p>
                {HOTSPOTS.map((h) => (
                  <button
                    key={h.id}
                    onClick={(e) => { e.stopPropagation(); setActive(h); }}
                    className={`absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${active.id === h.id ? 'border-white bg-[#b98a2e] text-white scale-125' : 'border-[#b98a2e] bg-white text-[#b98a2e] hover:scale-110'}`}
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    aria-label={h.label}
                  >
                    +
                  </button>
                ))}
              </div>
              <div className="bg-[#0b2a5b] px-3 py-2 text-center text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-300">Malabar Foods · Pune 411026</div>
            </div>
            {/* back */}
            <div className={`${face} bg-[#e9dfc7] p-4`} style={{ transform: 'rotateY(180deg) translateZ(70px)', position: 'absolute', inset: 0 }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#123a7a]">Nutrition · Veg · FSSAI 10012043001234</p>
              <div className="mt-2 space-y-1.5">
                {[90, 65, 80, 55, 75].map((w, i) => (
                  <div key={i} className="h-1.5 rounded bg-[#c9b992]" style={{ width: `${w}%` }} />
                ))}
              </div>
              <p className="mt-3 text-[8px] leading-relaxed text-slate-600">Mfd. by Malabar Foods Pvt. Ltd., Plot 44, MIDC Industrial Area, Pune 411026. For complaints: Customer Care 1800-266-7788, care@malabarfoods.in. Country of Origin: India.</p>
            </div>
            {/* right */}
            <div className={`${face} items-center justify-center bg-[#0b2a5b] text-center`} style={{ transform: 'rotateY(90deg) translateZ(70px)', position: 'absolute', top: 0, bottom: 0, left: '50%', width: '140px', marginLeft: '-70px' }}>
              <p className="rotate-90 whitespace-nowrap font-display text-lg font-semibold text-[#e8c877]">Basmati · 500 g</p>
            </div>
            {/* left */}
            <div className={`${face} items-center justify-center bg-[#0b2a5b] text-center`} style={{ transform: 'rotateY(-90deg) translateZ(70px)', position: 'absolute', top: 0, bottom: 0, left: '50%', width: '140px', marginLeft: '-70px' }}>
              <p className="-rotate-90 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">MFD 06/2026 · Batch B-221</p>
            </div>
            {/* top */}
            <div className={`${face} items-center justify-center bg-[#123a7a]`} style={{ transform: 'rotateX(90deg) translateZ(35px)', position: 'absolute', left: 0, right: 0, top: '50%', height: '140px', marginTop: '-70px' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e8c877]">Malabar</p>
            </div>
            {/* bottom */}
            <div className={`${face} bg-[#071c40]`} style={{ transform: 'rotateX(-90deg) translateZ(295px)', position: 'absolute', left: 0, right: 0, top: '50%', height: '140px', marginTop: '-70px' }} />
          </div>
          <div className="pointer-events-none absolute -bottom-2 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-xl" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => setAuto(!auto)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
            {auto ? <Pause size={13} /> : <RotateCw size={13} />} {auto ? 'Pause spin' : 'Auto-spin'}
          </button>
          <button onClick={() => setGrid(!grid)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
            <Grid3X3 size={13} /> {grid ? 'Hide PDP frame' : 'Show PDP frame'}
          </button>
          <span className="inline-flex items-center gap-1.5 px-2 text-xs text-slate-400"><Hand size={13} /> Drag the pack to rotate it</span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Interactive exhibit · Rule 6</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Six declarations. One panel.<br />Tap each marker.</h3>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HOTSPOTS.map((h) => (
            <button
              key={h.id}
              onClick={() => setActive(h)}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${active.id === h.id ? 'border-gold bg-gold/15 text-white' : 'border-white/15 text-slate-300 hover:border-white/40 hover:text-white'}`}
            >
              {h.label}
            </button>
          ))}
        </div>
        <div key={active.id} className="mt-4 rounded-xl border border-gold/40 bg-white/[0.06] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{active.rule}</p>
          <p className="mt-1 font-display text-xl font-semibold text-white">{active.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{active.desc}</p>
        </div>
      </div>
    </div>
  );
}
