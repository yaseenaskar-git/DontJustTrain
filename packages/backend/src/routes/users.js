const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const store = require('../store');
const db = require('../db');

// POST /users/signup - { token, name, password }
router.post('/signup', async (req, res) => {
  const { token, name, password } = req.body;
  if (!token || !name || !password) return res.status(400).json({ error: 'token, name, password required' });

  if (db.pool) {
    // postgres path
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const inviteRes = await client.query('SELECT * FROM invites WHERE token=$1 FOR UPDATE', [token]);
      if (inviteRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'invalid invite' }); }
      const invite = inviteRes.rows[0];
      if (invite.used) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'invite already used' }); }

      const userCheck = await client.query('SELECT id FROM users WHERE email=$1', [invite.email]);
      if (userCheck.rowCount > 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'email already registered' }); }

      const hashed = await bcrypt.hash(password, 10);
      const insertUser = await client.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [name, invite.email, hashed]);
      await client.query('UPDATE invites SET used=true WHERE token=$1', [token]);
      await client.query('COMMIT');
      const u = insertUser.rows[0];
      return res.json({ ok: true, user: { id: u.id, name: u.name, email: u.email } });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    } finally {
      client.release();
    }
  }

  // fallback JSON store
  const invites = store.read('invites');
  const invite = invites[token];
  if (!invite) return res.status(400).json({ error: 'invalid invite' });
  if (invite.used) return res.status(400).json({ error: 'invite already used' });

  const users = store.read('users');
  if (Object.values(users).some(u => u.email === invite.email)) return res.status(400).json({ error: 'email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const id = Object.keys(users).length + 1;
  const user = { id, name, email: invite.email, passwordHash: hashed, createdAt: new Date().toISOString() };
  users[id] = user;
  store.write('users', users);

  // mark invite used
  invite.used = true;
  invites[token] = invite;
  store.write('invites', invites);

  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
