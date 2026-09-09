import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { status, category, risk, search, fingerprint, limit } = req.query;
      let q = supabase.from('inspections').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (category) q = q.eq('category', category);
      if (risk) q = q.eq('risk', risk);
      if (fingerprint) q = q.eq('fingerprint', fingerprint);
      if (search) q = q.or(`product_name.ilike.%${search}%,manufacturer.ilike.%${search}%,inspection_id.ilike.%${search}%`);
      if (limit) q = q.limit(parseInt(limit, 10));
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const b = req.body;
      if (!b.product_name) return res.status(400).json({ error: 'product_name is required' });
      const stamp = Date.now().toString(36).toUpperCase();
      const inspection_id = b.inspection_id || `LMPC-${new Date().getFullYear()}-${stamp}`;
      const { data, error } = await supabase.from('inspections').insert({
        inspection_id,
        product_name: b.product_name,
        category: b.category || 'Food',
        manufacturer: b.manufacturer || '',
        address: b.address || '',
        net_quantity: b.net_quantity || '',
        mrp: b.mrp || '',
        mfg_info: b.mfg_info || '',
        country_origin: b.country_origin || 'India',
        consumer_care: b.consumer_care || '',
        image_url: b.image_url || '',
        declarations: b.declarations || {},
        rule_results: b.rule_results || [],
        score: b.score ?? 0,
        risk: b.risk || 'Medium',
        status: b.status || 'NEEDS REVIEW',
        inspector: b.inspector || 'Unassigned',
        decision: b.decision || 'Pending',
        decision_note: b.decision_note || '',
        fingerprint: b.fingerprint || '',
        prev_inspection_id: b.prev_inspection_id || null,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...patch } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase.from('inspections').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('inspections').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('inspections API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
