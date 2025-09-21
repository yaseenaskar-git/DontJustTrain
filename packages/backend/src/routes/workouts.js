const express = require('express');
const router = express.Router();
const store = require('../store');
const db = require('../db');
const { authMiddleware } = require('../auth');

// GET /workouts
router.get('/', async (req, res) => {
  if (db.pool) {
    try {
      const r = await db.query('SELECT id,title,exercises,created_by,created_at FROM workouts ORDER BY id');
      return res.json(r.rows.map(rw => ({ id: rw.id, title: rw.title, exercises: rw.exercises, createdBy: rw.created_by, createdAt: rw.created_at })));
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('workouts') || {};
  res.json(Object.values(data));
});

// POST /workouts (protected)
router.post('/', authMiddleware, async (req, res) => {
  const { title, exercises } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  if (db.pool) {
    try {
      const r = await db.query('INSERT INTO workouts(title,exercises,created_by) VALUES($1,$2,$3) RETURNING id,title,exercises,created_by,created_at', [title, exercises || [], req.user.id]);
      const rw = r.rows[0];
      return res.json({ id: rw.id, title: rw.title, exercises: rw.exercises, createdBy: rw.created_by, createdAt: rw.created_at });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('workouts') || {};
  const id = Date.now().toString();
  const w = { id, title, exercises: exercises || [], createdBy: req.user.id, createdAt: new Date().toISOString() };
  data[id] = w;
  store.write('workouts', data);
  res.json(w);
});

// DEV seed
router.post('/seed', async (req, res) => {
  if (db.pool) {
    try {
      await db.query(`INSERT INTO workouts(title,exercises) VALUES ('Full Body A', $1)`, [JSON.stringify([{ exerciseId: '1', order: 1 }])]);
      const r = await db.query('SELECT id,title,exercises,created_at FROM workouts');
      return res.json(r.rows.map(rw => ({ id: rw.id, title: rw.title, exercises: rw.exercises, createdAt: rw.created_at })));
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('workouts') || {};
  data['w1'] = { id: 'w1', title: 'Full Body A', exercises: [{ exerciseId: '1', order: 1 }], createdAt: new Date().toISOString() };
  store.write('workouts', data);
  res.json(Object.values(data));
});

module.exports = router;

// POST /workouts/:id/duplicate - duplicate a workout for the current user
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (db.pool) {
    try {
      const r = await db.query('SELECT title,exercises FROM workouts WHERE id=$1', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      const w = r.rows[0];
      const rr = await db.query('INSERT INTO workouts(title,exercises,created_by) VALUES($1,$2,$3) RETURNING id,title,exercises,created_by,created_at', [w.title + ' (copy)', w.exercises, req.user.id]);
      const rw = rr.rows[0];
      return res.json({ id: rw.id, title: rw.title, exercises: rw.exercises, createdBy: rw.created_by, createdAt: rw.created_at });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('workouts') || {};
  const w = data[id];
  if (!w) return res.status(404).json({ error: 'not found' });
  const nid = Date.now().toString();
  const copy = { id: nid, title: w.title + ' (copy)', exercises: JSON.parse(JSON.stringify(w.exercises)), createdBy: req.user.id, createdAt: new Date().toISOString() };
  data[nid] = copy; store.write('workouts', data);
  res.json(copy);
});
