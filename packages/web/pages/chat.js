import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { post, get } from '../lib/api';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [userId, setUserId] = useState('');
  const [toId, setToId] = useState('');
  const socketRef = useRef(null);

  useEffect(()=>{
    const s = getSocket();
    socketRef.current = s;
    s.connect();
    s.on('connect', ()=>{
      console.log('connected', s.id);
      if (userId) s.emit('join', userId);
    });
    s.on('message', (m) => {
      setMessages(prev => {
        const next = [...prev, m];
        // mark as read if message is to current user
        if (m.to === userId) {
          try { s.emit('read', { id: m.id || m.id }); } catch(e){}
        }
        return next;
      });
    });
    s.on('message:read', (m) => {
      // update message read state in UI
      setMessages(prev => prev.map(pm => (pm.id == m.id || pm.id == m.id) ? Object.assign({}, pm, { read: true, read_at: m.read_at || new Date().toISOString() }) : pm));
    });
    return () => { s.disconnect(); };
  }, [userId]);

  async function sendMessage(e) {
    e.preventDefault();
    const msg = { from: userId, to: toId, text, media: [] };
    socketRef.current.emit('message', msg);
    setText('');
  }

  async function uploadFile(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    // Try presigned flow first
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const presignRes = await post('/uploads/presign', { name: f.name, contentType: f.type });
      if (presignRes && presignRes.url) {
        // upload directly to S3
        await fetch(presignRes.url, { method: 'PUT', headers: { 'Content-Type': f.type }, body: f });
        const fileUrl = presignRes.url.split('?')[0];
        const msg = { from: userId, to: toId, text: '', media: [{ url: fileUrl, type: f.type }] };
        socketRef.current.emit('message', msg);
        return;
      }
    } catch (e) {
      console.warn('presign/upload failed, falling back to server upload', e);
    }
    // fallback: upload via server
    const form = new FormData();
    form.append('file', f);
    const res = await fetch((process.env.NEXT_PUBLIC_API_BASE||'http://localhost:4000') + '/uploads', { method: 'POST', body: form });
    const j = await res.json();
    if (j.url) {
      // if server returned relative url, prepend base
      const url = j.url.startsWith('http') ? j.url : (process.env.NEXT_PUBLIC_API_BASE||'http://localhost:4000') + j.url;
      const msg = { from: userId, to: toId, text: '', media: [{ url, type: f.type }] };
      socketRef.current.emit('message', msg);
    }
  }

  useEffect(()=>{
    const token = typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null;
    if (token && !userId) {
      // resolve user from /auth/me and auto-fill userId so socket can join
      (async () => {
        try {
          const j = await get('/auth/me');
          if (j && j.ok && j.user) {
            setUserId(String(j.user.id));
          }
        } catch (e) {
          console.warn('auth/me failed', e);
        }
      })();
    }
  }, []);

  return (
    <div style={{padding:20}}>
      <h2>Chat</h2>
      <div>
        <label>Your user id: <input value={userId} onChange={e=>setUserId(e.target.value)} /></label>
        <label>To id: <input value={toId} onChange={e=>setToId(e.target.value)} /></label>
      </div>
      <form onSubmit={sendMessage}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="message" />
        <button type="submit">Send</button>
      </form>
      <div>
        <input type="file" onChange={uploadFile} />
      </div>
      <ul>
        {messages.map((m,idx)=> (
          <li key={idx} style={{marginBottom:8}}>
            <div><strong>{m.from}</strong>: {m.text}</div>
            {m.media && m.media.map((md,i)=>(<div key={i}><a href={md.url} target="_blank">{md.url}</a></div>))}
            <div style={{fontSize:12,color:'#666'}}>{m.read ? `Read at ${m.read_at}` : (m.to == userId ? 'Unread' : '')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
