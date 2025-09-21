import { useState } from 'react';
import { post } from '../lib/api';

export default function InvitePage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  async function sendInvite(e) {
    e.preventDefault();
    const r = await post('/invites', { email });
    setResult(r);
  }

  return (
    <div style={{padding:20}}>
      <h2>Invite Client</h2>
      <form onSubmit={sendInvite}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="client email" />
        <button type="submit">Send Invite</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
