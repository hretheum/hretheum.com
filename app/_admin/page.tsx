import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import AdminSignIn from './parts/AdminSignIn';
import AdminEventsTable from './parts/AdminEventsTable';

function isAllowed(email: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  const allowed = isAllowed(email);

  if (!email || !allowed) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold mb-2">Admin Console</h1>
        <p className="text-sm text-gray-600 mb-4">Sign in with Google. Access is limited to approved admins.</p>
        <AdminSignIn />
        {email && !allowed && (
          <div className="mt-3 text-sm text-red-600">Your account is not authorized. Please contact the owner.</div>
        )}
        <div className="mt-6 text-sm text-gray-500">
          <Link href="/">Go back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Admin Console</h1>
        <form action="/auth/signout" method="post">
          <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Sign out</button>
        </form>
      </div>
      <AdminEventsTable />
    </div>
  );
}
