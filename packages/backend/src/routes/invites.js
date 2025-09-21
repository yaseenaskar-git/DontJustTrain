const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sgMail = require('@sendgrid/mail');
const store = require('../store');
const db = require('../db');

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_KEY) sgMail.setApiKey(SENDGRID_KEY);

// POST /invites - { email }
router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const token = uuidv4();
  if (db.pool) {
    try {
      await db.query('INSERT INTO invites(token,email,used) VALUES($1,$2,false)', [token, email]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'db error' });
    }
  } else {
    const invites = store.read('invites');
    const invite = { email, token, createdAt: new Date().toISOString(), used: false };
    invites[token] = invite;
    store.write('invites', invites);
  }

  const link = `${req.protocol}://${req.get('host')}/invites/accept?token=${token}`;

  if (SENDGRID_KEY) {
    try {
      await sgMail.send({
        to: email,
        from: 'no-reply@dontjusttrain.app',
        subject: 'You are invited to DontJustTrain',
        text: `Join my training app: ${link}`,
        html: `<p>Join my training app: <a href="${link}">${link}</a></p>`
      });
    } catch (e) {
      console.error('SendGrid error', e);
    }
  } else {
    console.log('Invite link (no SENDGRID configured):', link);
  }

  res.json({ ok: true, invite: { email, token } });
});

// GET /invites/accept?token=
router.get('/accept', async (req, res) => {
  const { token } = req.query;
  if (db.pool) {
    try {
      const r = await db.query('SELECT token,email,used,created_at FROM invites WHERE token=$1', [token]);
      if (r.rowCount === 0) return res.status(404).send('Invalid or expired invite');
      const inv = r.rows[0];
      if (inv.used) return res.status(400).send('Invite already used');
      return res.json({ ok: true, email: inv.email, token: inv.token });
    } catch (e) {
      console.error(e);
      return res.status(500).send('server error');
    }
  }

  const invites = store.read('invites');
  const invite = invites[token];
  if (!invite) return res.status(404).send('Invalid or expired invite');
  if (invite.used) return res.status(400).send('Invite already used');

  res.json({ ok: true, email: invite.email, token });
});

module.exports = router;
