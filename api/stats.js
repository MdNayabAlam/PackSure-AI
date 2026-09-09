import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: all, error } = await supabase.from('inspections').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    const rows = all || [];
    const total = rows.length;
    const compliant = rows.filter(r => r.status === 'COMPLIANT').length;
    const review = rows.filter(r => r.status === 'NEEDS REVIEW').length;
    const noncomp = rows.filter(r => r.status === 'NON-COMPLIANT').length;
    const avgScore = total ? Math.round(rows.reduce((s, r) => s + (r.score || 0), 0) / total) : 0;
    const highRisk = rows.filter(r => r.risk === 'High' || r.risk === 'Critical').length;

    const violCounts = {};
    const catCounts = {};
    const mfrScores = {};
    const mfrFails = {};
    const trend = {};
    for (const r of rows) {
      catCounts[r.category || 'Other'] = (catCounts[r.category || 'Other'] || 0) + 1;
      const m = r.manufacturer || 'Unknown';
      mfrScores[m] = mfrScores[m] || { total: 0, n: 0 };
      mfrScores[m].total += r.score || 0; mfrScores[m].n += 1;
      if (r.status === 'NON-COMPLIANT') mfrFails[m] = (mfrFails[m] || 0) + 1;
      for (const rr of (r.rule_results || [])) {
        if (rr.status === 'FAIL') violCounts[rr.ruleId] = (violCounts[rr.ruleId] || 0) + 1;
      }
      const d = (r.created_at || '').slice(0, 7);
      if (d) trend[d] = trend[d] || { month: d, total: 0, compliant: 0 };
      if (d) { trend[d].total += 1; if (r.status === 'COMPLIANT') trend[d].compliant += 1; }
    }
    const topViolations = Object.entries(violCounts).map(([ruleId, count]) => ({ ruleId, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    const riskyMfr = Object.entries(mfrScores).map(([name, v]) => ({
      name, avg: Math.round(v.total / v.n), inspections: v.n, failures: mfrFails[name] || 0,
    })).filter(m => m.inspections >= 1).sort((a, b) => a.avg - b.avg).slice(0, 6);
    const byCategory = Object.entries(catCounts).map(([name, count]) => ({ name, count }));
    const monthly = Object.values(trend).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);

    return res.status(200).json({
      totals: { total, compliant, review, noncomp, avgScore, highRisk },
      topViolations, riskyMfr, byCategory, monthly,
    });
  } catch (err) {
    console.error('stats API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
