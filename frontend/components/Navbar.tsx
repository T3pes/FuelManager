import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export function Navbar({ user }: { user: any }) {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-blue-700 text-white shadow mb-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg hover:underline">FuelManager</Link>
        <Link href="/tankers" className="hover:underline">Cisterne</Link>
        <Link href="/aircrafts" className="hover:underline">Velivoli</Link>
        <Link href="/operators" className="hover:underline">Operatori</Link>
        <Link href="/refuelings" className="hover:underline">Rifornimenti</Link>
      </div>
      <div className="flex items-center gap-4">
        {user && <span className="text-sm">{user.email}</span>}
        <button onClick={handleLogout} className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100 font-semibold">Logout</button>
      </div>
    </nav>
  );
}

