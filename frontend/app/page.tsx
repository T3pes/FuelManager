"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';
import {
  Bar,
  Line
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [tankers, setTankers] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [aircrafts, setAircrafts] = useState<any[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    fetchAll();
  }, []);

  async function fetchAll() {
    const [r, t, o, a] = await Promise.all([
      supabase.from('refuelings').select('*'),
      supabase.from('tankers').select('id, name, capacity'),
      supabase.from('operators').select('id, name'),
      supabase.from('aircrafts').select('id, code')
    ]);
    setRefuelings(r.data || []);
    setTankers(t.data || []);
    setOperators(o.data || []);
    setAircrafts(a.data || []);
    setLoading(false);
  }

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-zinc-500">Caricamento...</div>;

  // Preparo dati per i grafici
  // 1. Litri riforniti per giorno
  const byDay: Record<string, number> = {};
  refuelings.forEach(r => {
    const day = r.date ? new Date(r.date).toLocaleDateString() : '-';
    byDay[day] = (byDay[day] || 0) + Number(r.quantity || 0);
  });
  const days = Object.keys(byDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const litersByDay = days.map(d => byDay[d]);

  // 2. Litri per cisterna
  const byTanker: Record<string, number> = {};
  refuelings.forEach(r => {
    const t = tankers.find(tk => tk.id === r.tanker_id)?.name || 'Sconosciuta';
    byTanker[t] = (byTanker[t] || 0) + Number(r.quantity || 0);
  });
  const tankerNames = Object.keys(byTanker);
  const litersByTanker = tankerNames.map(t => byTanker[t]);

  // 3. Litri per operatore
  const byOperator: Record<string, number> = {};
  refuelings.forEach(r => {
    const o = operators.find(op => op.id === r.operator_id)?.name || 'Sconosciuto';
    byOperator[o] = (byOperator[o] || 0) + Number(r.quantity || 0);
  });
  const operatorNames = Object.keys(byOperator);
  const litersByOperator = operatorNames.map(o => byOperator[o]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <div className="max-w-5xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-2 text-blue-700">Benvenuto in FuelManager</h1>
        <p className="text-zinc-700 mb-8">Utente: <span className="font-mono">{user.email}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Litri riforniti per giorno</h2>
            <Line
              data={{
                labels: days,
                datasets: [{
                  label: 'Litri riforniti',
                  data: litersByDay,
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(37,99,235,0.2)',
                  fill: true
                }]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
          <div className="bg-zinc-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Litri riforniti per cisterna</h2>
            <Bar
              data={{
                labels: tankerNames,
                datasets: [{
                  label: 'Litri per cisterna',
                  data: litersByTanker,
                  backgroundColor: '#2563eb'
                }]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
          <div className="bg-zinc-100 p-6 rounded-xl shadow md:col-span-2">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Litri riforniti per operatore</h2>
            <Bar
              data={{
                labels: operatorNames,
                datasets: [{
                  label: 'Litri per operatore',
                  data: litersByOperator,
                  backgroundColor: '#22c55e'
                }]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
