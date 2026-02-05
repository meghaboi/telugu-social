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
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
      <Link href="/forum" className="text-lg font-semibold">
        telugu.social
      </Link>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/forum">Forum</Link>
        <Link href="/settings/profile">Edit Profile</Link>
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/mod">Mod</Link>
        <button onClick={logout} className="text-muted">
          Logout
        </button>
      </div>
    </nav>
  );
}
