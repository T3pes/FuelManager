"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function RefuelingsPage() {
  const [user, setUser] = useState<any>(null);
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState('');
  const [tankerId, setTankerId] = useState('');
  const [aircraftId, setAircraftId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [tankers, setTankers] = useState<any[]>([]);
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  // Funzione per esportare i dati in CSV
  function exportToCSV(rows: any[], filename: string) {
    if (!rows.length) return;
    const header = ['Operatore','Cisterna','Velivolo','Quantità','Data'];
    const csv = [
      header.join(','),
      ...rows.map(row => [
        operators.find(o => o.id === row.operator_id)?.name || '-',
        tankers.find(t => t.id === row.tanker_id)?.name || '-',
        aircrafts.find(a => a.id === row.aircraft_id)?.code || '-',
        row.quantity,
        row.date ? new Date(row.date).toLocaleString() : '-'
      ].map(v => '"' + (v ?? '') + '"').join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Funzione per inviare il CSV via email
  async function handleSendEmail(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSendMsg(null);
    setSending(true);
    try {
      // Genera CSV come stringa
      const header = ['Operatore','Cisterna','Velivolo','Quantità','Data'];
      const csv = [
        header.join(','),
        ...refuelings.map(row => [
          operators.find(o => o.id === row.operator_id)?.name || '-',
          tankers.find(t => t.id === row.tanker_id)?.name || '-',
          aircrafts.find(a => a.id === row.aircraft_id)?.code || '-',
          row.quantity,
          row.date ? new Date(row.date).toLocaleString() : '-'
        ].map(v => '"' + (v ?? '') + '"').join(','))
      ].join('\n');
      const subject = 'Report rifornimenti FuelManager';
      const text = 'In allegato il report dei rifornimenti.';
      const html = '<h2>Report rifornimenti FuelManager</h2><p>In allegato il file CSV dei rifornimenti.</p>';
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
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [r, o, t, a] = await Promise.all([
      supabase.from('refuelings').select('*').order('date', { ascending: false }),
      supabase.from('operators').select('id, name'),
      supabase.from('tankers').select('id, name'),
      supabase.from('aircrafts').select('id, code')
    ]);
    setRefuelings(r.data || []);
    setOperators(o.data || []);
    setTankers(t.data || []);
    setAircrafts(a.data || []);
    setLoading(false);
  }

  // Funzione per convertire stringa datetime-local in UTC ISO
  function localDateTimeToUTC(dateStr: string) {
    if (!dateStr) return dateStr;
    const [datePart, timePart] = dateStr.split('T');
    if (!datePart || !timePart) return dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute);
    return localDate.toISOString();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!operatorId || !tankerId || !aircraftId || !quantity || !date) return setError('Compila tutti i campi');
    // Conversione robusta data locale in UTC ISO string
    const dateUTC = localDateTimeToUTC(date);
    const { error } = await supabase.from('refuelings').insert([{ operator_id: operatorId, tanker_id: tankerId, aircraft_id: aircraftId, quantity: Number(quantity), date: dateUTC }]);
    if (error) setError(error.message);
    setOperatorId(''); setTankerId(''); setAircraftId(''); setQuantity(''); setDate('');
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo rifornimento?')) return;
    setError(null);
    if (!id) {
      setError('ID rifornimento non valido');
      return;
    }
    // DEBUG: mostra id e lista id presenti
    console.log('Tentativo eliminazione id:', id);
    console.log('Id presenti:', refuelings.map(r => r.id));
    const { error } = await supabase.from('refuelings').delete().eq('id', id);
    if (error) {
      setError('Errore eliminazione: ' + error.message);
    } else {
      const { data } = await supabase.from('refuelings').select('id').eq('id', id);
      if (data && data.length > 0) {
        setError('Attenzione: il record non è stato eliminato. id=' + id + ' presenti=' + refuelings.map(r => r.id).join(','));
      }
    }
    fetchAll();
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto py-10">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/" className="text-blue-700 hover:underline">&larr; Torna alla Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Gestione Rifornimenti</h1>
        {/* Pulsanti export e invio email */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => exportToCSV(refuelings, 'rifornimenti.csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
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
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={sending}>
              {sending ? 'Invio...' : 'Invia report via email'}
            </button>
          </form>
        </div>
        {sendMsg && <div className={sendMsg.startsWith('Errore') ? 'text-red-500' : 'text-green-600'}>{sendMsg}</div>}
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-6">
          <select value={operatorId} onChange={e => setOperatorId(e.target.value)} className="p-2 rounded bg-zinc-100 text-black border border-zinc-300">
            <option value="">Operatore</option>
            {operators.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={tankerId} onChange={e => setTankerId(e.target.value)} className="p-2 rounded bg-zinc-100 text-black border border-zinc-300">
            <option value="">Cisterna</option>
            {tankers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={aircraftId} onChange={e => setAircraftId(e.target.value)} className="p-2 rounded bg-zinc-100 text-black border border-zinc-300">
            <option value="">Velivolo</option>
            {aircrafts.map((a: any) => <option key={a.id} value={a.id}>{a.code}</option>)}
          </select>
          <input
            type="number"
            placeholder="Quantità (litri)"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-32 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
          />
          <input
            type="datetime-local"
            placeholder="Data"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-56 p-2 rounded bg-zinc-100 text-black border border-zinc-300"
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
                  <th className="p-2 text-center rounded-l min-w-[120px]">Operatore</th>
                  <th className="p-2 text-center min-w-[120px]">Cisterna</th>
                  <th className="p-2 text-center min-w-[120px]">Velivolo</th>
                  <th className="p-2 text-center min-w-[120px]">Quantità</th>
                  <th className="p-2 text-center min-w-[120px]">Data</th>
                  <th className="p-2 text-center rounded-r min-w-[120px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {refuelings.map(r => (
                  <tr key={r.id} className="bg-white border-b border-zinc-200">
                    <td className="p-2 text-center">{operators.find(o => o.id === r.operator_id)?.name || '-'}</td>
                    <td className="p-2 text-center">{tankers.find(t => t.id === r.tanker_id)?.name || '-'}</td>
                    <td className="p-2 text-center">{aircrafts.find(a => a.id === r.aircraft_id)?.code || '-'}</td>
                    <td className="p-2 text-center">{r.quantity}</td>
                    <td className="p-2 text-center">{r.date ? new Date(r.date).toLocaleString() : '-'}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">Elimina</button>
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
