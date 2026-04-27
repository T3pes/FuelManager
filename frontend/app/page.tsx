"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-zinc-500">Caricamento...</div>;
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-zinc-100 p-8 rounded-xl shadow text-center">
          <h1 className="text-2xl font-bold mb-2 text-blue-700">Benvenuto in FuelManager</h1>
          <p className="text-zinc-700 mb-4">Utente: <span className="font-mono">{user.email}</span></p>
          <a href="/tankers" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold">Vai a Gestione Cisterne</a>
        </div>
      </div>
    </main>
  );
}
