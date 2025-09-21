const express = require('express');
const router = express.Router();
const store = require('../store');
const db = require('../db');
const { authMiddleware } = require('../auth');

router.get('/', async (req, res) => {
  if (db.pool) {
    try {
      const r = await db.query('SELECT id,title,workouts,created_by,created_at FROM programs ORDER BY id');
      return res.json(r.rows.map(rw => ({ id: rw.id, title: rw.title, workouts: rw.workouts, createdBy: rw.created_by, createdAt: rw.created_at })));
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('programs') || {};
  res.json(Object.values(data));
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, workouts } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  if (db.pool) {
    try {
      const r = await db.query('INSERT INTO programs(title,workouts,created_by) VALUES($1,$2,$3) RETURNING id,title,workouts,created_by,created_at', [title, workouts || [], req.user.id]);
      const rw = r.rows[0];
      return res.json({ id: rw.id, title: rw.title, workouts: rw.workouts, createdBy: rw.created_by, createdAt: rw.created_at });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('programs') || {};
  const id = Date.now().toString();
  const p = { id, title, workouts: workouts || [], createdBy: req.user.id, createdAt: new Date().toISOString() };
  data[id] = p;
  store.write('programs', data);
  res.json(p);
});

router.post('/seed', async (req, res) => {
  if (db.pool) {
    try {
      await db.query(`INSERT INTO programs(title,workouts) VALUES ('Starter Program', $1)`, [JSON.stringify([{ workoutId: 'w1', order: 1 }])]);
      const r = await db.query('SELECT id,title,workouts,created_at FROM programs');
      return res.json(r.rows.map(rw => ({ id: rw.id, title: rw.title, workouts: rw.workouts, createdAt: rw.created_at })));
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const data = store.read('programs') || {};
  data['p1'] = { id: 'p1', title: 'Starter Program', workouts: [{ workoutId: 'w1', order: 1 }], createdAt: new Date().toISOString() };
  store.write('programs', data);
  res.json(Object.values(data));
});

module.exports = router;

// Simple scheduling: POST /programs/:id/schedule { startDate, repeats } -> create schedule
router.post('/:id/schedule', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { startDate, repeats } = req.body;
  if (!startDate) return res.status(400).json({ error: 'startDate required' });
  // For now, store schedules in a simple JSON store
  const store = require('../store');
  const schedules = store.read('schedules') || {};
  const sid = Date.now().toString();
  const s = { id: sid, programId: id, startDate, repeats: repeats || null, createdBy: req.user.id, createdAt: new Date().toISOString() };
  schedules[sid] = s; store.write('schedules', schedules);
  res.json(s);
});

// GET /schedules - list schedules (optional ?programId=)
router.get('/schedules', authMiddleware, async (req, res) => {
  const store = require('../store');
  const schedules = store.read('schedules') || {};
  const list = Object.values(schedules);
  const { programId } = req.query;
  if (programId) return res.json(list.filter(x => x.programId === programId));
  res.json(list);
});
