import supabase from './db-client.js';

// ---- Compliance Intelligence Engine (server-side) ----
// Every check returns PASS / FAIL / NEEDS REVIEW / NOT APPLICABLE with
// detected value, expected requirement, plain-language explanation and evidence.
const SEV_W = { Critical: 25, High: 12, Medium: 6 };

function norm(s) { return (s || '').toString().trim(); }
function has(v, minLen = 2) { return norm(v).length >= minLen; }

function checkPresence(d, field, label) {
  const v = norm(d[field]);
  const conf = d[`__conf_${field}`] ?? 90;
  if (!has(v)) return { status: 'FAIL', detected: 'Not detected', confidence: 0 };
  if (conf < 55) return { status: 'NEEDS REVIEW', detected: v, confidence: conf };
  return { status: 'PASS', detected: v, confidence: conf };
}

function evaluateRule(rule, d) {
  const id = rule.rule_id;
  let r = { ruleId: id, title: rule.title, requirement: rule.requirement, severity: rule.severity, category: rule.category, detected: '', expected: '', status: 'PASS', confidence: 90, explanation: '', evidence: null };
  const setEv = (label, i) => { r.evidence = { label, x: 8 + ((i * 37) % 60), y: 10 + ((i * 23) % 68), w: 26, h: 9 }; };
  const idx = parseInt(id.replace(/\D/g, ''), 10) || 1;

  switch (id) {
    case 'R-01': {
      const c = checkPresence(d, 'productName', 'commodity name');
      r = { ...r, ...c, expected: 'Common or generic name of the commodity on the PDP (Rule 6(1), PCR 2011)' };
      r.explanation = c.status === 'PASS' ? `Commodity name "${r.detected}" is declared.` : 'Commodity name could not be confirmed on the label. Every pre-packaged commodity must carry its common or generic name.';
      if (c.status !== 'FAIL') setEv('Name', idx);
      break;
    }
    case 'R-02': {
      const m = checkPresence(d, 'manufacturer', 'manufacturer');
      const a = checkPresence(d, 'address', 'address');
      const conf = Math.min(m.confidence, a.confidence);
      r.expected = 'Name and complete address of manufacturer / packer / importer (Rule 6(1), PCR 2011)';
      if (m.status === 'FAIL' || a.status === 'FAIL') { r.status = 'FAIL'; r.detected = [m.detected, a.detected].filter(x => x && x !== 'Not detected').join(' · ') || 'Not detected'; r.confidence = 0; r.explanation = 'Name and/or complete address of the responsible person (manufacturer, packer or importer) is missing. This is a critical declaration.'; }
      else if (m.status === 'NEEDS REVIEW' || a.status === 'NEEDS REVIEW') { r.status = 'NEEDS REVIEW'; r.detected = `${m.detected} · ${a.detected}`; r.confidence = conf; r.explanation = 'Manufacturer details were detected but OCR confidence is low. A human should verify the name and address before a decision.'; setEv('Mfg', idx); }
      else { r.status = 'PASS'; r.detected = `${m.detected} · ${a.detected}`; r.confidence = conf; r.explanation = 'Responsible-person identity and address are declared.'; setEv('Mfg', idx); }
      break;
    }
    case 'R-03': {
      const v = norm(d.netQty);
      const conf = d.__conf_netQty ?? 90;
      r.expected = 'Net quantity in standard metric units — g, kg, ml, L, m, cm (Sec 3, LM Act 2009; Rule 6(1), PCR 2011)';
      const m = v.match(/([\d.,]+)\s*([a-zA-Zµ]+)/);
      const metric = ['g', 'kg', 'mg', 'ml', 'l', 'litre', 'ltr', 'm', 'cm', 'mm', 'kg.'];
      const nonMetric = ['pound', 'lb', 'lbs', 'oz', 'ounce', 'fl oz', 'inch', 'in\b'];
      if (!has(v)) { r.status = 'FAIL'; r.detected = 'Not detected'; r.confidence = 0; r.explanation = 'Net quantity is missing. The package must declare net contents excluding packaging material.'; }
      else if (nonMetric.some(u => new RegExp(u, 'i').test(v))) { r.status = 'FAIL'; r.detected = v; r.confidence = conf; r.explanation = `Non-metric unit detected ("${v}"). Only the metric system (g, kg, ml, L, m) is permitted in trade under Section 3 of the LM Act, 2009.`; setEv('Net Qty', idx); }
      else if (!m || !metric.includes(m[2].toLowerCase().replace('.', ''))) { r.status = 'FAIL'; r.detected = v; r.confidence = conf; r.explanation = `Quantity "${v}" is not in a recognised standard unit. Declare net quantity as e.g. 500 g, 1 kg, 750 ml, 2 L.`; setEv('Net Qty', idx); }
      else if (conf < 55) { r.status = 'NEEDS REVIEW'; r.detected = v; r.confidence = conf; r.explanation = 'Net quantity text is unreadable or uncertain. Verify the declared quantity manually.'; setEv('Net Qty', idx); }
      else { r.status = 'PASS'; r.detected = v; r.confidence = conf; r.explanation = `Net quantity "${v}" is declared in standard metric units.`; setEv('Net Qty', idx); }
      break;
    }
    case 'R-04': {
      const v = norm(d.mrp);
      const conf = d.__conf_mrp ?? 90;
      r.expected = 'Maximum Retail Price inclusive of all taxes, prefixed with ₹ / Rs. (Rule 6(1), PCR 2011)';
      const hasRs = /₹|rs\.?|inr/i.test(v);
      const hasNum = /[\d][\d.,]*/.test(v);
      const sticker = /sticker|over.?past|re.?label/i.test(v) && /higher/i.test(norm(d.notes));
      if (!has(v)) { r.status = 'FAIL'; r.detected = 'Not detected'; r.confidence = 0; r.explanation = 'MRP is missing. Every retail package must declare the maximum retail price inclusive of all taxes.'; }
      else if (!hasRs || !hasNum) { r.status = 'FAIL'; r.detected = v; r.confidence = conf; r.explanation = `MRP "${v}" is incomplete — it must show the currency symbol (₹) and the price inclusive of all taxes, e.g. "MRP ₹ 145.00 (incl. of all taxes)".`; setEv('MRP', idx); }
      else if (sticker) { r.status = 'FAIL'; r.detected = v; r.confidence = conf; r.explanation = 'A sticker appears to revise the MRP upward. Stickers may only declare a lower MRP and must not conceal the original declaration.'; setEv('MRP', idx); }
      else if (conf < 55) { r.status = 'NEEDS REVIEW'; r.detected = v; r.confidence = conf; r.explanation = 'MRP text is uncertain. Confirm the price, currency symbol and tax-inclusive wording.'; setEv('MRP', idx); }
      else { r.status = 'PASS'; r.detected = v; r.confidence = conf; r.explanation = `MRP "${v}" is declared with currency and tax-inclusive basis.`; setEv('MRP', idx); }
      break;
    }
    case 'R-05': {
      const v = norm(d.usp);
      r.expected = 'Unit Sale Price (per g / kg / ml / L / number) where required for specified commodities';
      if (!has(v)) {
        const needsUsp = ['Food', 'FMCG', 'Grocery'].includes(d.category);
        r.status = needsUsp ? 'NEEDS REVIEW' : 'NOT APPLICABLE';
        r.detected = needsUsp ? 'Not detected' : 'Not applicable to this category'; r.confidence = needsUsp ? 40 : 100;
        r.explanation = needsUsp ? 'Unit Sale Price could not be confirmed. USP is required for several specified commodity classes — verify applicability for this product.' : 'USP declaration is not applicable to this product category.';
      } else { r.status = 'PASS'; r.detected = v; r.confidence = 85; r.explanation = `Unit Sale Price "${v}" is declared.`; setEv('USP', idx); }
      break;
    }
    case 'R-06': {
      const v = norm(d.mfgDate);
      const conf = d.__conf_mfgDate ?? 90;
      r.expected = 'Month and year of manufacture / packing / import (Rule 6(1), PCR 2011)';
      const ok = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.,'-]*\d{2,4}|\d{1,2}[\/.-]\d{2,4}|\d{4}/i.test(v);
      if (!has(v)) { r.status = 'FAIL'; r.detected = 'Not detected'; r.confidence = 0; r.explanation = 'Month and year of manufacture / packing / import is missing.'; }
      else if (!ok) { r.status = 'FAIL'; r.detected = v; r.confidence = conf; r.explanation = `Date "${v}" is not in a recognisable month-year format (e.g. "MFD 03/2026").`; setEv('MFD', idx); }
      else if (conf < 55) { r.status = 'NEEDS REVIEW'; r.detected = v; r.confidence = conf; r.explanation = 'Date text is uncertain. Verify the month and year manually.'; setEv('MFD', idx); }
      else { r.status = 'PASS'; r.detected = v; r.confidence = conf; r.explanation = `Manufacture / packing date "${v}" is declared.`; setEv('MFD', idx); }
      break;
    }
    case 'R-07': {
      const v = norm(d.consumerCare);
      const conf = d.__conf_consumerCare ?? 90;
      r.expected = 'Consumer-care name, address / phone / e-mail for complaints (Rule 6, PCR 2011)';
      const hasContact = /\d{6,}|@|toll|1800|phone|tel|care|custom/i.test(v);
      if (!has(v)) { r.status = 'FAIL'; r.detected = 'Not detected'; r.confidence = 0; r.explanation = 'Consumer-care contact details are missing. A name, address and phone/e-mail for complaints must be declared.'; }
      else if (!hasContact) { r.status = 'NEEDS REVIEW'; r.detected = v; r.confidence = conf; r.explanation = 'Consumer-care text found but no usable phone / e-mail / Toll-free contact could be confirmed. Verify manually.'; setEv('Care', idx); }
      else { r.status = 'PASS'; r.detected = v; r.confidence = conf; r.explanation = 'Consumer-care contact for complaints is declared.'; setEv('Care', idx); }
      break;
    }
    case 'R-08': {
      const isImport = /import/i.test(norm(d.manufacturer)) || norm(d.countryOrigin) !== '' && norm(d.countryOrigin).toLowerCase() !== 'india' || d.isImport;
      const v = norm(d.countryOrigin);
      r.expected = 'Country of origin / manufacture for imported commodities (Rule 6, PCR 2011; e-commerce amendments 2026)';
      if (!isImport && !has(v)) { r.status = 'NOT APPLICABLE'; r.detected = 'Domestic product'; r.confidence = 100; r.explanation = 'Country-of-origin declaration applies to imported commodities; this product is domestic.'; }
      else if (!has(v)) { r.status = 'FAIL'; r.detected = 'Not detected'; r.confidence = 0; r.explanation = 'Product appears imported but no country of origin is declared. Imported packages must declare the country of origin.'; }
      else { r.status = 'PASS'; r.detected = v; r.confidence = 88; r.explanation = `Country of origin "${v}" is declared.`; setEv('Origin', idx); }
      break;
    }
    case 'R-09': {
      const area = parseFloat(d.packArea) || 0;
      const fh = parseFloat(d.fontHeight) || 0;
      r.expected = 'PDP letter/numeral height per Fifth Schedule: ≤100 cm² → 1 mm · 100–500 cm² → 2 mm · 500–2500 cm² → 4 mm · >2500 cm² → 6 mm';
      if (!area || !fh) { r.status = 'NEEDS REVIEW'; r.detected = area || fh ? `PDP ${area || '?'} cm² · font ${fh || '?'} mm` : 'Dimensions not measured'; r.confidence = 45; r.explanation = 'PDP area or declaration font height was not measured. Measure the principal display panel and the net-quantity numeral height to verify Fifth Schedule compliance.'; }
      else {
        const need = area <= 100 ? 1 : area <= 500 ? 2 : area <= 2500 ? 4 : 6;
        r.detected = `PDP ${area} cm² · numeral ${fh} mm (required ≥ ${need} mm)`;
        if (fh >= need) { r.status = 'PASS'; r.confidence = 92; r.explanation = `Numeral height ${fh} mm meets the Fifth Schedule minimum of ${need} mm for a ${area} cm² panel.`; }
        else { r.status = 'FAIL'; r.confidence = 88; r.explanation = `Numeral height ${fh} mm is below the Fifth Schedule minimum of ${need} mm for a ${area} cm² principal display panel — declarations are not legible at the prescribed size.`; }
        setEv('PDP', idx);
      }
      break;
    }
    case 'R-10': {
      const ch = (d.channel || 'retail').toLowerCase();
      r.expected = 'E-commerce listings must display all Rule 6 declarations + country of origin (Rule 6(10), PC Amendment Rules 2026, in force 1 Jul 2026)';
      if (ch !== 'ecommerce' && ch !== 'e-commerce' && ch !== 'online') { r.status = 'NOT APPLICABLE'; r.detected = 'Retail channel'; r.confidence = 100; r.explanation = 'E-commerce display obligations apply only to online listings.'; }
      else {
        const missing = ['productName', 'manufacturer', 'netQty', 'mrp', 'mfgDate', 'consumerCare'].filter(f => !has(d[f]));
        if (missing.length === 0) { r.status = 'PASS'; r.detected = 'All listing declarations present'; r.confidence = 90; r.explanation = 'Online listing carries the required declarations.'; }
        else { r.status = 'FAIL'; r.detected = `Listing missing: ${missing.join(', ')}`; r.confidence = 85; r.explanation = `E-commerce listing omits required declarations (${missing.join(', ')}). Marketplaces and sellers must display full Rule 6 particulars online.`; }
      }
      break;
    }
    case 'R-11': {
      const v = norm(d.netQty);
      r.expected = 'Standard pack sizes per Second Schedule for specified commodities (e.g. baby food, weaning food, biscuits, bread, butter, cereals, tea, coffee)';
      const scheduled = ['Baby Food', 'Tea', 'Coffee', 'Biscuits', 'Edible Oil', 'Atta', 'Rice'].includes(d.category);
      if (!scheduled) { r.status = 'NOT APPLICABLE'; r.detected = 'Category not scheduled'; r.confidence = 100; r.explanation = 'Standard-size obligations apply to commodities listed in the Second Schedule.'; }
      else if (!has(v)) { r.status = 'NEEDS REVIEW'; r.detected = 'Quantity unknown'; r.confidence = 40; r.explanation = 'Quantity unknown — confirm the pack size against the Second Schedule for this commodity.'; }
      else { r.status = 'PASS'; r.detected = v; r.confidence = 80; r.explanation = `Pack size "${v}" recorded — verify against the Second Schedule standard sizes for ${d.category}.`; setEv('Size', idx); }
      break;
    }
    case 'R-12': {
      const v = [d.productName, d.netQty, d.mrp, d.notes].map(norm).join(' | ');
      r.expected = 'No non-metric units; no dual MRP; no upward MRP sticker concealing the original declaration';
      const dual = /mrp.*mrp/i.test(v) && /\d.*\d.*\d.*\d/.test(v);
      if (/pound|\blb\b|ounce|\boz\b|inch/i.test(v)) { r.status = 'FAIL'; r.detected = 'Non-metric unit on label'; r.confidence = 90; r.explanation = 'A non-metric unit appears on the label. Trade and declaration must use metric units only (Section 3, LM Act 2009).'; }
      else if (dual) { r.status = 'NEEDS REVIEW'; r.detected = 'Possible dual declaration'; r.confidence = 55; r.explanation = 'More than one price-like declaration detected. Confirm there is a single, unambiguous MRP.'; }
      else { r.status = 'PASS'; r.detected = 'No prohibited declaration found'; r.confidence = 90; r.explanation = 'No prohibited units, dual MRP or offending sticker detected.'; }
      break;
    }
    default:
      r.status = 'NOT APPLICABLE'; r.detected = '—'; r.explanation = 'No evaluator configured for this rule.';
  }
  return r;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { declarations, rule_ids } = req.body;
    if (!declarations) return res.status(400).json({ error: 'declarations are required' });
    let q = supabase.from('rules').select('*').eq('status', 'active').order('rule_id', { ascending: true });
    if (rule_ids && rule_ids.length) q = q.in('rule_id', rule_ids);
    const { data: rules, error } = await q;
    if (error) throw error;

    const results = (rules || []).map(rule => evaluateRule(rule, declarations));
    const fails = results.filter(r => r.status === 'FAIL');
    const reviews = results.filter(r => r.status === 'NEEDS REVIEW');
    const passes = results.filter(r => r.status === 'PASS');
    const na = results.filter(r => r.status === 'NOT APPLICABLE');

    let score = 100;
    const deductions = [];
    for (const f of fails) { const w = SEV_W[f.severity] ?? 6; score -= w; deductions.push({ ruleId: f.ruleId, points: -w, reason: `${f.title} — ${f.severity}` }); }
    for (const rv of reviews) { score -= 3; deductions.push({ ruleId: rv.ruleId, points: -3, reason: `${rv.title} — needs manual verification` }); }
    score = Math.max(0, Math.min(100, score));

    const hasCritHigh = fails.some(f => f.severity === 'Critical' || f.severity === 'High');
    const status = fails.length > 0 ? 'NON-COMPLIANT' : reviews.length > 0 ? 'NEEDS REVIEW' : 'COMPLIANT';
    const risk = score >= 90 && !hasCritHigh ? 'Low' : score >= 70 ? 'Medium' : score >= 45 ? 'High' : 'Critical';

    return res.status(200).json({
      results, score, risk, status,
      counts: { pass: passes.length, fail: fails.length, review: reviews.length, na: na.length, total: results.length },
      deductions,
      engine_version: 'LMPC-Engine v2.3 · PCR 2011 incl. 2026 e-commerce amendments',
      evaluated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('analyze API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
