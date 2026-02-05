import { TopNav } from '@/components/top-nav';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <section className="space-y-4 rounded-2xl border border-white/10 bg-surface p-5">
        <h1 className="text-2xl font-semibold">About telugu.social</h1>
        <p className="text-muted">telugu.social is a Telugu-first community space built for students and young professionals to discuss culture, city life, careers, and relationships in a safer way.</p>
        <p className="text-muted">We focus on meaningful, local conversations with lightweight moderation. Users can report harmful content, and repeated reports automatically hide posts/comments for moderator review.</p>
        <p className="text-muted">This MVP is intentionally simple: phone OTP sign-in, easy onboarding, forums, comments, and reactions. The goal is to listen to real users and keep improving based on community behavior.</p>
      </section>
    </main>
  );
}
