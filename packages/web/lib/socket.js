import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
let socket = null;
export function getSocket() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null;
  if (!socket || (socket && socket.auth && socket.auth.token !== token)) {
    if (socket) try { socket.disconnect(); } catch(e){}
    socket = io(API_BASE, { autoConnect: false, auth: { token } });
  }
  return socket;
}
