import { useEffect, useState } from 'react';
import { get, post } from '../lib/api';

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [title, setTitle] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null;

  async function load() {
    const data = await get('/workouts');
    setWorkouts(data || []);
  }
  useEffect(()=>{ load(); }, []);

  async function create(e) {
    e.preventDefault();
    await post('/workouts', { title }, token);
    setTitle('');
    load();
  }

  return (
    <div style={{padding:20}}>
      <h2>Workouts</h2>
      <form onSubmit={create}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="title" />
        <button type="submit">Create</button>
      </form>
      <ul>
        {workouts.map(w => (
          <li key={w.id} style={{marginBottom:8}}>
            {w.title} <button onClick={async ()=>{ await post(`/workouts/${w.id}/duplicate`, {}); load(); }}>Duplicate</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
