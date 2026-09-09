import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ScanLine, FileSearch, ListChecks, Image as ImageIcon, Gavel, FileBadge } from 'lucide-react';

const STEPS = [
  { icon: ScanLine, stage: 'Stage 01', title: 'Scan the package', text: 'Capture the label with a camera, upload shelf photos, or scan the barcode. The system registers the image, the outlet and the inspector — the start of the audit trail.', img: '/images/shelf-hero.jpg' },
  { icon: FileSearch, stage: 'Stage 02', title: 'Extract every declaration', text: 'OCR reads the label and maps text to the Rule 6 fields — name, maker, net quantity, MRP, dates, care contact. Low-confidence reads are flagged, never guessed.', img: '/images/pack-food.jpg' },
  { icon: ListChecks, stage: 'Stage 03', title: 'Validate rule by rule', text: 'The compliance engine checks each declaration independently against the configured rules — metric units, tax-inclusive MRP, Fifth Schedule letter heights, e-commerce display.', img: '/images/factory-line.jpg' },
  { icon: ImageIcon, stage: 'Stage 04', title: 'See the evidence', text: 'MRP, net quantity and maker are highlighted on the pack photo itself — green where valid, red where violated, amber where a human must look. A judge grasps it in seconds.', img: '/images/pack-cosmetic.jpg' },
  { icon: Gavel, stage: 'Stage 05', title: 'Decide with context', text: 'Approve, send for manual review, or flag non-compliance — with the product\'s full history and repeat-violation record beside the decision, not buried in a file.', img: '/images/office-desk.jpg' },
  { icon: FileBadge, stage: 'Stage 06', title: 'Issue the report', text: 'One click produces the official inspection record — image, extracted declarations, checklist, evidence, decision and audit timeline — saved for analytics and appeal.', img: '/images/warehouse.jpg' },
];

export default function ScrollJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.45'] });
  const beam = useTransform(scrollYProgress, [0, 1], ['4%', '96%']);

  return (
    <div ref={ref} className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_60px_-20px_rgba(11,42,91,0.35)]">
          <div className="relative h-64 overflow-hidden sm:h-80">
            <motion.img src="/images/scan-store.jpg" alt="Inspector scanning a package on a store shelf" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/images/shelf-hero.jpg'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/10 to-transparent" />
            <motion.div className="absolute inset-x-0 h-10 border-y-2 border-gold/90 bg-gold/15 backdrop-blur-[1px]" style={{ top: beam }} />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Live inspection</p>
                <p className="font-display text-xl font-semibold text-white">Scan → Evidence → Decision</p>
              </div>
              <span className="rounded-full bg-emerald-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-navy-deep">Recording</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Inspection ID</p>
              <p className="font-mono text-sm font-semibold text-ink">LMPC-2026-LIVE</p>
            </div>
            <div className="h-10 w-px bg-line" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Progress</p>
              <p className="font-mono text-sm font-semibold text-ink"><motion.span>{beam}</motion.span> of journey</p>
            </div>
            <div className="h-10 w-px bg-line" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Audit trail</p>
              <p className="font-mono text-sm font-semibold text-emerald-700">● Active</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.stage}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="group grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.05)] transition hover:border-navy/40 sm:grid-cols-[64px_1fr_120px] sm:items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy text-gold sm:h-16 sm:w-16">
              <s.icon size={26} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-saffron">{s.stage}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
            <div className="hidden overflow-hidden rounded-lg sm:block">
              <img src={s.img} alt={s.title} className="h-24 w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <span className="hidden">{i}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
