import { useEffect, useState } from 'react';
import { get, post } from '../lib/api';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [title, setTitle] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null;

  async function load() {
    const data = await get('/programs');
    setPrograms(data || []);
  }
  useEffect(()=>{ load(); }, []);

  async function create(e) {
    e.preventDefault();
    await post('/programs', { title }, token);
    setTitle('');
    load();
  }

  return (
    <div style={{padding:20}}>
      <h2>Programs</h2>
      <form onSubmit={create}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="title" />
        <button type="submit">Create</button>
      </form>
      <ul>
        {programs.map(p => (
          <li key={p.id} style={{marginBottom:8}}>
            {p.title} <button onClick={async ()=>{
              const startDate = prompt('Start date (YYYY-MM-DD)', new Date().toISOString().slice(0,10));
              if (!startDate) return; await post(`/programs/${p.id}/schedule`, { startDate }); alert('Scheduled');
            }}>Schedule</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
