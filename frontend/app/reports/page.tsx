"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
      if (!data?.user) {
        router.push('/login');
      }
    };
    getUser();
    fetchData();
  }, []);


  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase.from('refuelings').select('*');
    if (error) setError(error.message);
    else setRefuelings(data || []);
    setLoading(false);
  }

  const totalLiters = refuelings.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  // Esporta i dati in CSV
  function exportToCSV(rows: any[], filename: string) {
    const header = ['ID','Operatore','Cisterna','Velivolo','Quantità','Data','Creato il'];
    const sep = ';';
    const csv = [
      header.join(sep),
      ...(rows.length > 0 ? rows.map(row => [
        row.id,
        row.operator_id,
        row.tanker_id,
        row.aircraft_id,
        row.quantity,
        row.date ? new Date(row.date).toLocaleString() : '-',
        row.created_at ? new Date(row.created_at).toLocaleString() : '-'
      ].map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(sep)) : [])
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Invia il CSV via email
  async function handleSendEmail(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSendMsg(null);
    setSending(true);
    try {
      const header = ['ID','Operatore','Cisterna','Velivolo','Quantità','Data','Creato il'];
      const sep = ';';
      const csv = [
        header.join(sep),
        ...refuelings.map(row => [
          row.id,
          row.operator_id,
          row.tanker_id,
          row.aircraft_id,
          row.quantity,
          row.date ? new Date(row.date).toLocaleString() : '-',
          row.created_at ? new Date(row.created_at).toLocaleString() : '-'
        ].map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(sep))
      ].join('\n');
      const subject = 'Report rifornimenti FuelManager';
      const text = `Totale rifornimenti: ${refuelings.length}\nTotale litri erogati: ${totalLiters}`;
      const html = `<h2>Report rifornimenti FuelManager</h2><p>Totale rifornimenti: <b>${refuelings.length}</b><br/>Totale litri erogati: <b>${totalLiters}</b></p>`;
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.split(',').map(e => e.trim()),
          subject,
          text,
          html,
          csvContent: csv,
          csvFilename: 'rifornimenti.csv'
        })
      });
      if (res.ok) setSendMsg('Email inviata con successo!');
      else setSendMsg('Errore invio email: ' + (await res.json()).error);
    } catch (err: any) {
      setSendMsg('Errore invio email: ' + err.message);
    }
    setSending(false);
  }

  useEffect(() => {
    if (!email) return;
    const now = new Date();
    const next19 = new Date(now);
    next19.setHours(19, 0, 0, 0);
    if (now > next19) next19.setDate(next19.getDate() + 1);
    const timeout = setTimeout(() => {
      handleSendEmail();
    }, next19.getTime() - now.getTime());
    return () => clearTimeout(timeout);
  }, [email, refuelings.length]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-zinc-500">Caricamento...</div>;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Reportistica</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="bg-zinc-100 p-4 rounded mb-6 text-blue-900">
          <div className="mb-2">Totale rifornimenti: <b>{refuelings.length}</b></div>
          <div className="mb-2">Totale litri erogati: <b>{totalLiters}</b></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => exportToCSV(refuelings, 'rifornimenti.csv')}
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${refuelings.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={refuelings.length === 0}>
            Scarica CSV
          </button>
          <form onSubmit={handleSendEmail} className="flex gap-2">
            <input
              type="text"
              placeholder="Email destinatari (separate da virgola)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="p-2 rounded bg-zinc-100 text-black border border-zinc-300"
              required
              disabled={refuelings.length === 0}
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={sending || refuelings.length === 0}>
              {sending ? 'Invio...' : 'Invia report via email'}
            </button>
          </form>
        </div>
        {sendMsg && <div className={sendMsg.startsWith('Errore') ? 'text-red-500' : 'text-green-600'}>{sendMsg}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-blue-900 border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="bg-zinc-200">
                <th className="p-2 rounded-l">ID</th>
                <th className="p-2">Operatore</th>
                <th className="p-2">Cisterna</th>
                <th className="p-2">Velivolo</th>
                <th className="p-2">Quantità</th>
                <th className="p-2">Data</th>
                <th className="p-2 rounded-r">Creato il</th>
              </tr>
            </thead>
            <tbody>
              {refuelings.map(r => (
                <tr key={r.id} className="bg-white border-b border-zinc-200">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.operator_id}</td>
                  <td className="p-2">{r.tanker_id}</td>
                  <td className="p-2">{r.aircraft_id}</td>
                  <td className="p-2">{r.quantity}</td>
                  <td className="p-2">{r.date ? new Date(r.date).toLocaleString() : '-'}</td>
                  <td className="p-2">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

