const express = require('express');
const router = express.Router();
const db = require('../db');
const store = require('../store');
const { authMiddleware } = require('../auth');

// GET /messages?threadId= or ?userId=
router.get('/', authMiddleware, async (req, res) => {
  const { threadId, userId } = req.query;
  if (db.pool) {
    try {
      if (threadId) {
        const r = await db.query('SELECT * FROM messages WHERE thread_id=$1 ORDER BY created_at', [threadId]);
        return res.json(r.rows);
      }
      if (userId) {
        const r = await db.query('SELECT * FROM messages WHERE from_user=$1 OR to_user=$1 ORDER BY created_at', [userId]);
        return res.json(r.rows);
      }
      return res.json([]);
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const msgs = store.read('messages') || {};
  const arr = Object.values(msgs).filter(m => (threadId ? m.threadId === threadId : userId ? m.from === userId || m.to === userId : true));
  res.json(arr);
});

// POST /messages { to, threadId, text, media }
router.post('/', authMiddleware, async (req, res) => {
  const { to, threadId, text, media } = req.body;
  const message = { from: req.user.id, to: to || null, threadId: threadId || null, text: text || '', media: media || [], createdAt: new Date().toISOString() };
  if (db.pool) {
    try {
      const r = await db.query('INSERT INTO messages(from_user,to_user,thread_id,text,media) VALUES($1,$2,$3,$4,$5) RETURNING *', [message.from, message.to, message.threadId, message.text, message.media]);
      return res.json(r.rows[0]);
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const msgs = store.read('messages') || {};
  const id = Date.now().toString();
  msgs[id] = { id, ...message };
  store.write('messages', msgs);
  res.json(msgs[id]);
});

module.exports = router;

// POST /messages/:id/read - mark as read
router.post('/:id/read', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  if (require('../db').pool) {
    try {
      const r = await require('../db').query('UPDATE messages SET read=true, read_at=now() WHERE id=$1 RETURNING *', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      // notify sender via socket
      try { const io = require('../index').io; if (io && r.rows[0].from_user) io.to(`user:${r.rows[0].from_user}`).emit('message:read', r.rows[0]); } catch(e){}
      return res.json(r.rows[0]);
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const store = require('../store');
  const msgs = store.read('messages') || {};
  const m = msgs[id];
  if (!m) return res.status(404).json({ error: 'not found' });
  m.read = true; m.read_at = new Date().toISOString(); msgs[id] = m; store.write('messages', msgs);
  // notify sender via emit - best-effort (index may not export io in this branch)
  try { const io = require('../index').io; if (io && m.from) io.to(`user:${m.from}`).emit('message:read', m); } catch(e){}
  res.json(m);
});
