import { useEffect, useState } from 'react';
import { get, post } from '../lib/api';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null;

  async function load() {
    const data = await get('/exercises');
    setExercises(data || []);
  }

  useEffect(()=>{ load(); }, []);

  async function create(e) {
    e.preventDefault();
    await post('/exercises', { title, videoUrl, description: '' }, token);
    setTitle(''); setVideoUrl('');
    load();
  }

  return (
    <div style={{padding:20}}>
      <h2>Exercises</h2>
      <form onSubmit={create}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="title" />
        <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="videoUrl" />
        <button type="submit">Create</button>
      </form>
      <ul>
        {exercises.map(x => (
          <li key={x.id}>{x.title} - {x.videoUrl}</li>
        ))}
      </ul>
    </div>
  );
}
