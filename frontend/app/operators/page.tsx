"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchOperators(); }, []);

  async function fetchOperators() {
    setLoading(true);
    const { data, error } = await supabase.from('operators').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setOperators(data || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !email || !role) return setError('Compila tutti i campi');
    const { error } = await supabase.from('operators').insert([{ name, email, role }]);
    if (error) setError(error.message);
    setName('');
    setEmail('');
    setRole('operator');
    fetchOperators();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo operatore?')) return;
    const { error } = await supabase.from('operators').delete().eq('id', id);
    if (error) setError(error.message);
    fetchOperators();
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/" className="text-blue-700 hover:underline">&larr; Torna alla Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-white">Gestione Operatori</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-40 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
        >
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Aggiungi</button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="text-zinc-400">Caricamento...</div>
      ) : (
        <table className="w-full text-white border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-zinc-800">
              <th className="p-2 rounded-l">Nome</th>
              <th className="p-2">Email</th>
              <th className="p-2">Ruolo</th>
              <th className="p-2 rounded-r">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {operators.map(o => (
              <tr key={o.id} className="bg-zinc-900">
                <td className="p-2">{o.name}</td>
                <td className="p-2">{o.email}</td>
                <td className="p-2">{o.role}</td>
                <td className="p-2">
                  <button onClick={() => handleDelete(o.id)} className="text-red-400 hover:underline">Elimina</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

