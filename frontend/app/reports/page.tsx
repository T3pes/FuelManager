"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

function exportToCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(','), ...rows.map(row => header.map(h => '"' + (row[h] ?? '') + '"').join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase.from('refuelings').select('*');
    if (error) setError(error.message);
    else setRefuelings(data || []);
    setLoading(false);
  }

  // Esempio di aggregazione: totale litri
  const totalLiters = refuelings.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  async function handleSendEmail(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSendMsg(null);
    setSending(true);
    try {
      const subject = 'Report rifornimenti FuelManager';
      const text = `Totale rifornimenti: ${refuelings.length}\nTotale litri erogati: ${totalLiters}`;
      const html = `<h2>Report rifornimenti FuelManager</h2><p>Totale rifornimenti: <b>${refuelings.length}</b><br/>Totale litri erogati: <b>${totalLiters}</b></p>`;
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject, text, html })
      });
      if (res.ok) setSendMsg('Email inviata con successo!');
      else setSendMsg('Errore invio email: ' + (await res.json()).error);
    } catch (err: any) {
      setSendMsg('Errore invio email: ' + err.message);
    }
    setSending(false);
  }

  // Invio automatico ogni giorno alle 19:00 (solo lato client, finché la pagina è aperta)
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

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/" className="text-blue-700 hover:underline">&larr; Torna alla Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-white">Reportistica</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="text-zinc-400">Caricamento...</div>
      ) : (
        <>
          <div className="bg-zinc-900 p-4 rounded mb-6 text-white">
            <div className="mb-2">Totale rifornimenti: <b>{refuelings.length}</b></div>
            <div className="mb-2">Totale litri erogati: <b>{totalLiters}</b></div>
          </div>
          <form onSubmit={handleSendEmail} className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Destinatario email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="p-2 rounded bg-zinc-100 text-black border border-zinc-300"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={sending}>
              {sending ? 'Invio...' : 'Invia report via email'}
            </button>
          </form>
          {sendMsg && <div className={sendMsg.startsWith('Errore') ? 'text-red-500' : 'text-green-500'}>{sendMsg}</div>}
          <button
            onClick={() => exportToCSV(refuelings, 'rifornimenti.csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
          >
            Esporta CSV
          </button>
          <table className="w-full text-white border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="bg-zinc-800">
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
                <tr key={r.id} className="bg-zinc-900">
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
        </>
      )}
    </div>
  );
}
