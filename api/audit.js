import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { limit } = req.query;
      let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
      if (limit) q = q.limit(parseInt(limit, 10));
      else q = q.limit(200);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { actor, action, inspection_ref, detail } = req.body;
      if (!action) return res.status(400).json({ error: 'action is required' });
      const { data, error } = await supabase.from('audit_log').insert({
        actor: actor || 'System', action, inspection_ref: inspection_ref || null, detail: detail || '',
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('audit API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
