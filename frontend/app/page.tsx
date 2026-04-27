
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default async function Home() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    redirect('/login');
  }
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Benvenuto in FuelManager</h1>
    </main>
  );
}
