const fetch = require('node-fetch');
(async ()=>{
  const API = process.env.API_BASE || 'http://localhost:4000';
  const token = process.env.TEST_JWT || null;
  try {
    console.log('GET /');
    console.log(await (await fetch(API + '/')).json());
    if (token) {
      console.log('GET /auth/me');
      console.log(await (await fetch(API + '/auth/me', { headers: { Authorization: `Bearer ${token}` } })).json());
    } else console.log('Skipping /auth/me (no TEST_JWT)');
    try {
      console.log('POST /uploads/presign');
      const pres = await (await fetch(API + '/uploads/presign', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify({ name: 'smoke.txt', contentType: 'text/plain' }) })).json();
      console.log(pres);
    } catch(e){ console.error('presign error', e); }
  } catch (e) { console.error(e); process.exit(2); }
})();
