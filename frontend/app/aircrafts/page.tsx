"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function AircraftsPage() {
  const [user, setUser] = useState<any>(null);
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    fetchAircrafts();
  }, []);

  async function fetchAircrafts() {
    setLoading(true);
    const { data, error } = await supabase.from('aircrafts').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setAircrafts(data || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code || !type) return setError('Compila tutti i campi');
    const { error } = await supabase.from('aircrafts').insert([{ code, type }]);
    if (error) setError(error.message);
    setCode('');
    setType('');
    fetchAircrafts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo velivolo?')) return;
    const { error } = await supabase.from('aircrafts').delete().eq('id', id);
    if (error) setError(error.message);
    fetchAircrafts();
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="max-w-2xl mx-auto py-10">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/" className="text-blue-700 hover:underline">&larr; Torna alla Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Gestione Velivoli</h1>
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Codice velivolo"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="flex-1 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <input
            type="text"
            placeholder="Tipo"
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-40 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Aggiungi</button>
        </form>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div className="text-zinc-500">Caricamento...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-blue-900 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="bg-zinc-200">
                  <th className="p-2 text-center rounded-l min-w-[120px]">Codice</th>
                  <th className="p-2 text-center min-w-[120px]">Tipo</th>
                  <th className="p-2 text-center rounded-r min-w-[120px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {aircrafts.map(a => (
                  <tr key={a.id} className="bg-white border-b border-zinc-200">
                    <td className="p-2 text-center">{a.code}</td>
                    <td className="p-2 text-center">{a.type}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline">Elimina</button>
                      </div>
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
