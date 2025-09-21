const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function main() {
  const API = process.env.API_BASE || 'http://localhost:4000';
  const token = process.env.TEST_JWT || null; // optional
  console.log('Requesting presign from', API + '/uploads/presign');
  const res = await fetch(API + '/uploads/presign', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), body: JSON.stringify({ name: 'test.txt', contentType: 'text/plain' }) });
  const j = await res.json();
  console.log('Presign response:', j);
  if (!j.url) {
    console.error('No presign URL returned');
    process.exit(2);
  }
  // upload a small file
  const tmp = path.join(__dirname, 'tmp-test.txt');
  fs.writeFileSync(tmp, 'hello from presign test');
  const fileBuf = fs.readFileSync(tmp);
  const up = await fetch(j.url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: fileBuf });
  console.log('Upload status', up.status, up.statusText);
  if (up.ok) console.log('Uploaded successfully. Object URL (without query):', j.url.split('?')[0]);
  else console.error('Upload failed');
}

main().catch(e=>{ console.error(e); process.exit(1); });
