"use client";

import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
    if (!error) window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm space-y-6 border border-zinc-200">
        <h1 className="text-3xl font-bold text-center text-black mb-2">FuelManager</h1>
        <p className="text-center text-zinc-600 mb-4">Accedi con le tue credenziali</p>
        <div className="flex items-center border border-zinc-300 rounded px-3 py-2 bg-zinc-100 focus-within:ring-2 ring-blue-500">
          <FaUser className="text-zinc-500 mr-2" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-transparent outline-none text-black placeholder-zinc-400"
            required
          />
        </div>
        <div className="flex items-center border border-zinc-300 rounded px-3 py-2 bg-zinc-100 focus-within:ring-2 ring-blue-500">
          <FaLock className="text-zinc-500 mr-2" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-transparent outline-none text-black placeholder-zinc-400"
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
