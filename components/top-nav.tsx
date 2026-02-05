'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function TopNav() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  }

  return (
    <nav className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
      <Link href="/forum" className="text-lg font-semibold">telugu.social</Link>
      <div className="flex gap-4 text-sm">
        <Link href="/forum">Forum</Link>
        <Link href="/settings/profile">Edit Profile</Link>
        <Link href="/mod">Mod</Link>
        <button onClick={logout} className="text-muted">Logout</button>
      </div>
    </nav>
  );
}
