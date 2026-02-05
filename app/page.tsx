import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <p className="text-sm uppercase tracking-wide text-accent">telugu.social • MVP</p>
      <h1 className="text-4xl font-bold">Core auth and forum loops are now live.</h1>
      <p className="text-muted">Sign in with phone OTP, create your profile, post in forums, comment, react, report, and moderate.</p>
      <Link href="/auth" className="w-fit rounded-lg bg-accent px-4 py-3 font-semibold text-black">Start with phone OTP</Link>
    </main>
  );
}
