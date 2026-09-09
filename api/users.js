import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { email } = req.query;
      let q = supabase.from('app_users').select('*').order('id', { ascending: true });
      if (email) q = q.eq('email', email);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { name, email, role } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
      const { data, error } = await supabase.from('app_users').insert({
        name, email, role: role || 'Inspector', active: true, last_active: new Date().toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...patch } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase.from('app_users').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('users API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
