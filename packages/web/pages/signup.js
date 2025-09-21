import { useState } from 'react';
import { post } from '../lib/api';

export default function SignupPage() {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);

  async function signup(e) {
    e.preventDefault();
    const r = await post('/users/signup', { token, name, password });
    setResult(r);
  }

  return (
    <div style={{padding:20}}>
      <h2>Signup</h2>
      <form onSubmit={signup}>
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="invite token" />
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="your name" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Sign up</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
