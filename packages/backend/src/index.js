const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'DontJustTrain backend running' });
});

const invitesRouter = require('./routes/invites');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const exercisesRouter = require('./routes/exercises');
const workoutsRouter = require('./routes/workouts');
const programsRouter = require('./routes/programs');
const messagesRouter = require('./routes/messages');
const uploadsRouter = require('./routes/uploads');

// serve uploaded files in development
app.use('/uploads', express.static(path.join(__dirname, '..', 'data', 'uploads')));

app.use('/invites', invitesRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/exercises', exercisesRouter);
app.use('/workouts', workoutsRouter);
app.use('/programs', programsRouter);
app.use('/messages', messagesRouter);
app.use('/uploads', uploadsRouter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, SECRET);
    socket.user = { id: payload.id, email: payload.email, name: payload.name };
    return next();
  } catch (e) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id, 'user', socket.user && socket.user.id);
  // join room for user id
  socket.join(`user:${socket.user.id}`);

  // send message event: { to, threadId, text, media }
  socket.on('message', async (msg) => {
    // attach from
    msg.from = socket.user.id;
    try {
      const db = require('./db');
      let saved = null;
      if (db.pool) {
        const r = await db.query('INSERT INTO messages(from_user,to_user,thread_id,text,media) VALUES($1,$2,$3,$4,$5) RETURNING *', [msg.from, msg.to || null, msg.threadId || null, msg.text || null, msg.media || []]);
        saved = r.rows[0];
      } else {
        const store = require('./store');
        const msgs = store.read('messages') || {};
        const id = Date.now().toString();
        msgs[id] = { id, from: msg.from, to: msg.to || null, threadId: msg.threadId || null, text: msg.text || '', media: msg.media || [], createdAt: new Date().toISOString() };
        store.write('messages', msgs);
        saved = msgs[id];
      }
      // emit to recipient and sender
      if (msg.to) io.to(`user:${msg.to}`).emit('message', saved);
      io.to(`user:${msg.from}`).emit('message', saved);
    } catch (e) {
      console.error('socket message error', e);
    }
  });
  // client reports message(s) read: payload can be { id } or { ids: [] }
  socket.on('read', async (payload) => {
    try {
      const db = require('./db');
      if (db.pool) {
        const ids = payload.ids && Array.isArray(payload.ids) ? payload.ids : payload.id ? [payload.id] : [];
        for (const id of ids) {
          const r = await db.query('UPDATE messages SET read=true, read_at=now() WHERE id=$1 RETURNING *', [id]);
          if (r.rowCount > 0) {
            const msg = r.rows[0];
            // notify original sender
            if (msg.from_user) io.to(`user:${msg.from_user}`).emit('message:read', msg);
          }
        }
      } else {
        const store = require('./store');
        const msgs = store.read('messages') || {};
        const ids = payload.ids && Array.isArray(payload.ids) ? payload.ids : payload.id ? [payload.id] : [];
        for (const id of ids) {
          const m = msgs[id];
          if (m) { m.read = true; m.read_at = new Date().toISOString(); msgs[id] = m; if (m.from) io.to(`user:${m.from}`).emit('message:read', m); }
        }
        store.write('messages', msgs);
      }
    } catch (e) {
      console.error('read handler error', e);
    }
  });
});

server.listen(port, () => console.log(`Backend listening on ${port}`));

// export for other modules to emit events
module.exports = { server, io };
