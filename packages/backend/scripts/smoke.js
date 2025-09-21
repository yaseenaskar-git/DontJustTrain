const fetch = require('node-fetch');
async function main(){
  const API = process.env.API_BASE || 'http://localhost:4000';
  try {
    const r = await fetch(API + '/');
    const j = await r.json();
    console.log('smoke result', j);
    process.exit(0);
  } catch(e){ console.error('smoke failed', e); process.exit(2); }
}
main();
