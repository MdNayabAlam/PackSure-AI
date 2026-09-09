import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { review_status } = req.query;
      let q = supabase.from('review_queue').select('*').order('created_at', { ascending: false });
      if (review_status) q = q.eq('review_status', review_status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { inspection_ref, product_name, issue, priority, confidence, risk_score, inspector } = req.body;
      if (!inspection_ref || !product_name) return res.status(400).json({ error: 'inspection_ref and product_name are required' });
      const { data, error } = await supabase.from('review_queue').insert({
        inspection_ref, product_name, issue, priority: priority || 'Medium',
        confidence: confidence ?? 50, risk_score: risk_score ?? 50,
        inspector: inspector || 'Unassigned', review_status: 'Open',
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...patch } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase.from('review_queue').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('review_queue').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('review API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
