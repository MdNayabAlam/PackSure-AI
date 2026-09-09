import supabase from './db-client.js';
import { hashPassword } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // GET USERS
    if (req.method === 'GET') {
      const { email } = req.query;

      let q = supabase
        .from('app_users')
        .select('id,name,email,role,active,last_active')
        .order('id', { ascending: true });

      if (email) q = q.eq('email', email);

      const { data, error } = await q;

      if (error) throw error;

      return res.status(200).json(data);
    }

    // ADD USER
    if (req.method === 'POST') {
      const { name, email, role, password } = req.body;

      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '');

      if (!cleanName || !cleanEmail || !cleanPassword) {
        return res.status(400).json({
          error: 'name, email and password are required'
        });
      }

      if (cleanPassword.length < 8) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters'
        });
      }

      const { data, error } = await supabase
        .from('app_users')
        .insert({
          name: cleanName,
          email: cleanEmail,
          password_hash: hashPassword(cleanPassword),
          role: role || 'Inspector',
          active: true,
          last_active: new Date().toISOString().slice(0, 10),
        })
        .select('id,name,email,role,active,last_active')
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    }

    // UPDATE USER
    if (req.method === 'PUT') {
      const { id, ...patch } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const { data, error } = await supabase
        .from('app_users')
        .update(patch)
        .eq('id', id)
        .select('id,name,email,role,active,last_active')
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (err) {
    console.error('users API error:', err);

    return res.status(500).json({
      error: err.message
    });
  }
}