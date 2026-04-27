"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function TankersPage() {
  const [user, setUser] = useState<any>(null);
  const [tankers, setTankers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    fetchTankers();
  }, []);

  async function fetchTankers() {
    setLoading(true);
    const { data, error } = await supabase.from('tankers').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setTankers(data || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !capacity) return setError('Compila tutti i campi');
    const { error } = await supabase.from('tankers').insert([{ name, capacity: Number(capacity) }]);
    if (error) setError(error.message);
    setName('');
    setCapacity('');
    fetchTankers();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa cisterna?')) return;
    const { error } = await supabase.from('tankers').delete().eq('id', id);
    if (error) setError(error.message);
    fetchTankers();
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="max-w-2xl mx-auto py-10">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/" className="text-blue-700 hover:underline">&larr; Torna alla Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Gestione Cisterne</h1>
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nome cisterna"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <input
            type="number"
            placeholder="Capacità (litri)"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="w-40 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Aggiungi</button>
        </form>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div className="text-zinc-500">Caricamento...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-blue-900 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="bg-zinc-200">
                  <th className="p-2 rounded-l">Nome</th>
                  <th className="p-2">Capacità</th>
                  <th className="p-2 rounded-r">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {tankers.map(t => (
                  <tr key={t.id} className="bg-white border-b border-zinc-200">
                    <td className="p-2">{t.name}</td>
                    <td className="p-2">{t.capacity}</td>
                    <td className="p-2">
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">Elimina</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
