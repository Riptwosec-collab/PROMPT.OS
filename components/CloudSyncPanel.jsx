'use client';

import { useEffect, useState } from 'react';
import { hasSupabaseConfig } from '../lib/cloud/supabase-browser.js';
import { getCloudUser, pullCloudState, pushCloudState, sendMagicLink, signOutCloud, subscribeCloudAuth } from '../lib/cloud/sync-client.js';

export default function CloudSyncPanel({ payload, onPull }) {
  const configured = hasSupabaseConfig();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(configured ? 'IDLE' : 'LOCAL_ONLY');

  useEffect(() => {
    if (!configured) return undefined;
    getCloudUser().then(setUser);
    return subscribeCloudAuth(setUser);
  }, [configured]);

  const run = async (label, action) => {
    try {
      setStatus(`${label}...`);
      await action();
      setStatus(`${label}_OK`);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || `${label}_FAILED`);
    }
  };

  const pull = () => run('PULL', async () => {
    const row = await pullCloudState();
    if (!row?.payload) throw new Error('NO_CLOUD_BACKUP');
    if (!window.confirm('Replace the local database with the cloud copy?')) return;
    onPull(row.payload);
  });

  return (
    <div className="relative font-mono">
      <button onClick={() => setOpen((value) => !value)} className={`px-3 py-2 border text-[10px] tracking-widest ${user ? 'border-green-700 text-green-400' : 'border-cyan-900 text-cyan-500'}`}>
        {user ? 'CLOUD_ON' : configured ? 'CLOUD' : 'LOCAL'}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-[120] w-80 max-w-[90vw] bg-[#03060b] border border-cyan-800 shadow-2xl p-4 space-y-3">
          <div className="flex justify-between text-[10px]"><span className="text-cyan-600">SUPABASE_SYNC</span><span className="text-gray-500 truncate max-w-40">{user?.email || status}</span></div>
          {!configured ? (
            <div className="text-[10px] text-amber-500 leading-relaxed">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable cloud sync.</div>
          ) : !user ? (
            <>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="EMAIL" className="w-full bg-black border border-cyan-900 text-cyan-300 p-2 text-xs outline-none focus:border-cyan-500" />
              <button disabled={!email} onClick={() => run('MAGIC_LINK', () => sendMagicLink(email))} className="w-full border border-cyan-700 text-cyan-400 py-2 text-[10px] disabled:opacity-30">SEND_MAGIC_LINK</button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => run('PUSH', () => pushCloudState(payload))} className="border border-cyan-700 text-cyan-400 py-2 text-[10px]">PUSH_CLOUD</button>
              <button onClick={pull} className="border border-cyan-700 text-cyan-400 py-2 text-[10px]">PULL_CLOUD</button>
              <button onClick={() => run('SIGN_OUT', signOutCloud)} className="col-span-2 border border-red-900 text-red-400 py-2 text-[10px]">SIGN_OUT</button>
            </div>
          )}
          <div className="text-[9px] text-gray-600 break-words">{status}</div>
        </div>
      )}
    </div>
  );
}
