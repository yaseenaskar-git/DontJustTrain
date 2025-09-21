import React, { useEffect, useState, useRef } from 'react';
import { Text, View, FlatList, Button, TextInput, TouchableOpacity } from 'react-native';

const API_BASE = 'http://10.0.2.2:4000';

function ExercisesView() {
  const [ex, setEx] = useState([]);
  useEffect(()=>{
    fetch(API_BASE + '/exercises')
      .then(r=>r.json())
      .then(d=>setEx(d))
      .catch(()=>{});
  },[]);
  return (
    <View style={{flex:1}}>
      <Text style={{fontSize:18,fontWeight:'bold'}}>Exercises</Text>
      <FlatList data={ex} keyExtractor={i=>i.id} renderItem={({item}) => <Text style={{padding:8}}>{item.title}</Text>} />
    </View>
  );
}

function MobileChat() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [toId, setToId] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(()=>{
    const t = null; // no auth flow in mobile yet
    setToken(t);
  },[]);

  async function fetchMe() {
    const t = token || null;
    try {
      const headers = t ? { Authorization: `Bearer ${t}` } : {};
      const r = await fetch(API_BASE + '/auth/me', { headers });
      const j = await r.json();
      if (j && j.ok) setUser(j.user);
    } catch (e){}
  }

  async function sendMessage() {
    const payload = { to: toId || null, text, media: [] };
    try {
      await fetch(API_BASE + '/messages', { method: 'POST', headers: Object.assign({ 'Content-Type':'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), body: JSON.stringify(payload) });
      setText('');
    } catch(e){}
  }

  async function uploadAndSend(fileName, fileBlob, mimeType) {
    try {
      // request presign
      const r = await fetch(API_BASE + '/uploads/presign', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify({ name: fileName, contentType: mimeType }) });
      const j = await r.json();
      if (j && j.url) {
        await fetch(j.url, { method: 'PUT', headers: { 'Content-Type': mimeType }, body: fileBlob });
        const fileUrl = j.url.split('?')[0];
        await fetch(API_BASE + '/messages', { method: 'POST', headers: Object.assign({ 'Content-Type':'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), body: JSON.stringify({ to: toId || null, text: '', media: [{ url: fileUrl, type: mimeType }] }) });
      }
    } catch (e) { console.warn('upload failed', e); }
  }

  return (
    <View style={{flex:1}}>
      <Text style={{fontSize:18,fontWeight:'bold'}}>Chat (Mobile)</Text>
      <Button title="Resolve me" onPress={fetchMe} />
      <Text>User: {user ? `${user.id} ${user.name}` : 'not resolved'}</Text>
      <TextInput placeholder="To id" value={toId} onChangeText={setToId} style={{borderWidth:1,padding:8,marginVertical:8}} />
      <TextInput placeholder="message" value={text} onChangeText={setText} style={{borderWidth:1,padding:8,marginBottom:8}} />
      <Button title="Send" onPress={sendMessage} />
      <Text style={{marginTop:12}}>Messages (not real-time in this simple mobile view)</Text>
      <FlatList data={messages} keyExtractor={m=>m.id} renderItem={({item}) => <Text>{item.from}: {item.text}</Text>} />
    </View>
  );
}

export default function App(){
  const [view, setView] = useState('ex');
  return (
    <View style={{flex:1,padding:20}}>
      <View style={{flexDirection:'row',marginBottom:12}}>
        <TouchableOpacity onPress={()=>setView('ex')} style={{marginRight:12}}><Text>Exercises</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setView('chat')}><Text>Chat</Text></TouchableOpacity>
      </View>
      {view === 'ex' ? <ExercisesView /> : <MobileChat />}
    </View>
  );
}
