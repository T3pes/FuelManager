"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function OperatorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setAuthLoading(false);
    };
    getUser();
    fetchOperators();
  }, []);

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

  if (authLoading) return <div className="flex min-h-screen items-center justify-center text-zinc-500">Caricamento...</div>;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="max-w-2xl mx-auto py-10">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/" className="text-blue-700 hover:underline">&larr; Torna alla Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Gestione Operatori</h1>
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-40 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
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
          <div className="text-zinc-500">Caricamento...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-blue-900 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="bg-zinc-200">
                  <th className="p-2 text-center rounded-l min-w-[120px]">Nome</th>
                  <th className="p-2 text-center min-w-[120px]">Email</th>
                  <th className="p-2 text-center min-w-[120px]">Ruolo</th>
                  <th className="p-2 text-center rounded-r min-w-[120px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {operators.map(o => (
                  <tr key={o.id} className="bg-white border-b border-zinc-200">
                    <td className="p-2 text-center">{o.name}</td>
                    <td className="p-2 text-center">{o.email}</td>
                    <td className="p-2 text-center">{o.role}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:underline">Elimina</button>
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
