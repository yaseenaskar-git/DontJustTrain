import { useState } from 'react';
import { post } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);

  async function login(e) {
    e.preventDefault();
    const r = await post('/auth/login', { email, password });
    setResult(r);
    if (r && r.token) localStorage.setItem('djt_token', r.token);
  }

  return (
    <div style={{padding:20}}>
      <h2>Login</h2>
      <form onSubmit={login}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Login</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
