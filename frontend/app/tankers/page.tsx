"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

type Tanker = { id: string; name: string; capacity: number };
type Refueling = { id: string; tanker_id: string; quantity: number };

export default function TankersPage() {
  const [user, setUser] = useState<any>(null);
  const [tankers, setTankers] = useState<Tanker[]>([]);
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('');


  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [tankersRes, refuelingsRes] = await Promise.all([
      supabase.from('tankers').select('*').order('created_at', { ascending: false }),
      supabase.from('refuelings').select('id, tanker_id, quantity')
    ]);
    if (tankersRes.error) setError(tankersRes.error.message);
    else setTankers(tankersRes.data || []);
    if (refuelingsRes.error) setError(refuelingsRes.error.message);
    else setRefuelings(refuelingsRes.data || []);
    setLoading(false);
  }

  // fetchTankers non più usata

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !capacity) return setError('Compila tutti i campi');
    const { error } = await supabase.from('tankers').insert([{ name, capacity: Number(capacity) }]);
    if (error) setError(error.message);
    setName('');
    setCapacity('');
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa cisterna?')) return;
    const { error } = await supabase.from('tankers').delete().eq('id', id);
    if (error) setError(error.message);
    fetchAll();
  }

  function startEdit(t: any) {
    setEditId(t.id);
    setEditName(t.name);
    setEditCapacity(t.capacity.toString());
  }

  function cancelEdit() {
    setEditId(null);
    setEditName('');
    setEditCapacity('');
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editName || !editCapacity) return setError('Compila tutti i campi');
    const { error } = await supabase.from('tankers').update({ name: editName, capacity: Number(editCapacity) }).eq('id', editId);
    if (error) setError(error.message);
    cancelEdit();
    fetchAll();
  }

  if (!user) return null;

  // Calcolo capacità residua per ogni cisterna
  function getResidue(tankerId: string, capacity: number) {
    const used = refuelings
      .filter(r => r.tanker_id === tankerId)
      .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    return capacity - used;
  }

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
            <table className="w-full table-fixed text-blue-900 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="bg-zinc-200">
                  <th className="p-2 text-center rounded-l min-w-[120px]">Nome</th>
                  <th className="p-2 text-center min-w-[120px]">Capacità</th>
                  <th className="p-2 text-center min-w-[120px]">Capacità residua</th>
                  <th className="p-2 text-center rounded-r min-w-[120px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {tankers.map(t => (
                  <tr key={t.id} className="bg-white border-b border-zinc-200">
                    {editId === t.id ? (
                      <>
                        <td className="p-2 text-center">
                          <input value={editName} onChange={e => setEditName(e.target.value)} className="p-1 rounded border border-zinc-300 w-full" />
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} className="p-1 rounded border border-zinc-300 w-full" />
                        </td>
                        <td className="p-2 text-center text-zinc-400">-</td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={handleEditSave} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Salva</button>
                            <button onClick={cancelEdit} className="bg-zinc-200 text-blue-700 px-2 py-1 rounded hover:bg-zinc-300">Annulla</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 text-center">{t.name}</td>
                        <td className="p-2 text-center">{t.capacity}</td>
                        <td className="p-2 text-center">{getResidue(t.id, t.capacity)}</td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => startEdit(t)} className="text-blue-600 hover:underline">Modifica</button>
                            <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">Elimina</button>
                          </div>
                        </td>
                      </>
                    )}
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
