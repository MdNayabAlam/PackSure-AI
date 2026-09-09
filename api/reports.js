import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { inspection_ref } = req.query;
      let q = supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (inspection_ref) q = q.eq('inspection_ref', inspection_ref);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { inspection_ref, generated_by, payload } = req.body;
      if (!inspection_ref) return res.status(400).json({ error: 'inspection_ref is required' });
      const report_no = `RPT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase.from('reports').insert({
        inspection_ref, report_no, generated_by: generated_by || 'Inspector', payload: payload || {},
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('reports API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
