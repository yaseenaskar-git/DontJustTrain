const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const store = require('../store');
const db = require('../db');
const { generateToken } = require('../auth');

// GET /auth/me - return user info from Authorization header
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'authorization required' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid auth header' });
  try {
    const jwt = require('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(parts[1], SECRET);
    if (require('../db').pool) {
      const r = await require('../db').query('SELECT id,name,email FROM users WHERE id=$1', [payload.id]);
      if (r.rowCount === 0) return res.status(401).json({ error: 'user not found' });
      const u = r.rows[0];
      return res.json({ ok: true, user: { id: u.id, name: u.name, email: u.email } });
    } else {
      const store = require('../store');
      const users = store.read('users');
      const user = users[payload.id];
      if (!user) return res.status(401).json({ error: 'user not found' });
      return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
    }
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
});

// POST /auth/login { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  if (db.pool) {
    try {
      const r = await db.query('SELECT id,name,email,password_hash FROM users WHERE email=$1', [email]);
      if (r.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });
      const user = r.rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid credentials' });
      const token = generateToken({ id: user.id, email: user.email, name: user.name });
      return res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  const users = store.read('users');
  const user = Object.values(users).find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = generateToken(user);
  res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

module.exports = router;
