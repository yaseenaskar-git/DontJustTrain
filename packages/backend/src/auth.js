const jwt = require('jsonwebtoken');
const store = require('./store');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '7d' });
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'authorization required' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid auth header' });
  try {
    const payload = jwt.verify(parts[1], SECRET);
    if (db.pool) {
      const r = await db.query('SELECT id,name,email FROM users WHERE id=$1', [payload.id]);
      if (r.rowCount === 0) return res.status(401).json({ error: 'user not found' });
      const user = r.rows[0];
      req.user = { id: user.id, email: user.email, name: user.name };
    } else {
      const users = store.read('users');
      const user = users[payload.id];
      if (!user) return res.status(401).json({ error: 'user not found' });
      req.user = { id: user.id, email: user.email, name: user.name };
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { generateToken, authMiddleware };
