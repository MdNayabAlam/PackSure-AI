import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { status } = req.query;
      let q = supabase.from('rules').select('*').order('rule_id', { ascending: true });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { rule_id, title, requirement, category, severity, validation_type, status, params, applicable_categories } = req.body;
      if (!rule_id || !title) return res.status(400).json({ error: 'rule_id and title are required' });
      const { data, error } = await supabase.from('rules').insert({
        rule_id, title, requirement, category, severity,
        validation_type: validation_type || 'presence', status: status || 'active',
        params: params || {}, applicable_categories: applicable_categories || ['all'], version: 1,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...patch } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data: current } = await supabase.from('rules').select('version').eq('id', id).single();
      const nextVersion = (current?.version || 1) + 1;
      const { data, error } = await supabase.from('rules').update({ ...patch, version: nextVersion }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('rules').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('rules API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
