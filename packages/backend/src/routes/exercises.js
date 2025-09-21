const express = require('express');
const router = express.Router();
const store = require('../store');
const db = require('../db');
const { authMiddleware } = require('../auth');

// GET /exercises
router.get('/', async (req, res) => {
  if (db.pool) {
    try {
      const r = await db.query('SELECT id,title,description,video_url,thumbnail_url,tags,created_by,created_at FROM exercises ORDER BY id');
      return res.json(r.rows.map(rw => ({ id: rw.id, title: rw.title, description: rw.description, videoUrl: rw.video_url, thumbnailUrl: rw.thumbnail_url, tags: rw.tags, createdBy: rw.created_by, createdAt: rw.created_at })));
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const exercises = store.read('exercises') || {};
  res.json(Object.values(exercises));
});

// GET /exercises/:id
router.get('/:id', async (req, res) => {
  if (db.pool) {
    try {
      const r = await db.query('SELECT id,title,description,video_url,thumbnail_url,tags,created_by,created_at FROM exercises WHERE id=$1', [req.params.id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      const rw = r.rows[0];
      return res.json({ id: rw.id, title: rw.title, description: rw.description, videoUrl: rw.video_url, thumbnailUrl: rw.thumbnail_url, tags: rw.tags, createdBy: rw.created_by, createdAt: rw.created_at });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const exercises = store.read('exercises') || {};
  const ex = exercises[req.params.id];
  if (!ex) return res.status(404).json({ error: 'not found' });
  res.json(ex);
});

// POST /exercises (protected)
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, videoUrl, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  if (db.pool) {
    try {
      const r = await db.query('INSERT INTO exercises(title,description,video_url,tags,created_by) VALUES($1,$2,$3,$4,$5) RETURNING id,title,description,video_url,tags,created_by,created_at', [title, description || '', videoUrl || '', tags || [], req.user.id]);
      const rw = r.rows[0];
      return res.json({ id: rw.id, title: rw.title, description: rw.description, videoUrl: rw.video_url, tags: rw.tags, createdBy: rw.created_by, createdAt: rw.created_at });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const exercises = store.read('exercises') || {};
  const id = Date.now().toString();
  const ex = { id, title, description: description || '', videoUrl: videoUrl || '', tags: tags || [], createdBy: req.user.id, createdAt: new Date().toISOString() };
  exercises[id] = ex;
  store.write('exercises', exercises);
  res.json(ex);
});

// PUT /exercises/:id (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, videoUrl, tags } = req.body;
  if (db.pool) {
    try {
      const r = await db.query('UPDATE exercises SET title=$1,description=$2,video_url=$3,tags=$4 WHERE id=$5 RETURNING id,title,description,video_url,tags,created_by,created_at', [title, description, videoUrl, tags, req.params.id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      const rw = r.rows[0];
      return res.json({ id: rw.id, title: rw.title, description: rw.description, videoUrl: rw.video_url, tags: rw.tags, createdBy: rw.created_by, createdAt: rw.created_at });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const exercises = store.read('exercises') || {};
  const ex = exercises[req.params.id];
  if (!ex) return res.status(404).json({ error: 'not found' });
  ex.title = title || ex.title;
  ex.description = description || ex.description;
  ex.videoUrl = videoUrl || ex.videoUrl;
  ex.tags = tags || ex.tags;
  exercises[req.params.id] = ex;
  store.write('exercises', exercises);
  res.json(ex);
});

// DELETE /exercises/:id (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (db.pool) {
    try {
      const r = await db.query('DELETE FROM exercises WHERE id=$1 RETURNING id', [req.params.id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      return res.json({ ok: true });
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const exercises = store.read('exercises') || {};
  if (!exercises[req.params.id]) return res.status(404).json({ error: 'not found' });
  delete exercises[req.params.id];
  store.write('exercises', exercises);
  res.json({ ok: true });
});

// DEV: POST /exercises/seed - create sample exercises
router.post('/seed', async (req, res) => {
  if (db.pool) {
    try {
      await db.query(`INSERT INTO exercises(title,description,video_url,tags) VALUES
        ('Squat','Barbell back squat','https://youtu.be/squat',ARRAY['legs','strength']),
        ('Push-up','Bodyweight push-up','https://youtu.be/pushup',ARRAY['upper','endurance'])
      `);
      const r = await db.query('SELECT id,title,description,video_url,tags,created_at FROM exercises');
      return res.json(r.rows.map(rw => ({ id: rw.id, title: rw.title, description: rw.description, videoUrl: rw.video_url, tags: rw.tags, createdAt: rw.created_at })));
    } catch (e) { console.error(e); return res.status(500).json({ error: 'db error' }); }
  }
  const exercises = store.read('exercises') || {};
  const samples = [
    { id: '1', title: 'Squat', description: 'Barbell back squat', videoUrl: 'https://youtu.be/squat', tags: ['legs','strength'], createdAt: new Date().toISOString() },
    { id: '2', title: 'Push-up', description: 'Bodyweight push-up', videoUrl: 'https://youtu.be/pushup', tags: ['upper','endurance'], createdAt: new Date().toISOString() }
  ];
  samples.forEach(s => exercises[s.id] = s);
  store.write('exercises', exercises);
  res.json(Object.values(exercises));
});

module.exports = router;
