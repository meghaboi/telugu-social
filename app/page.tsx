import { ForumCategoryCard } from '@/components/forum-category-card';
import { forumCategories, reactions, successMetrics } from '@/lib/constants';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">telugu.social • MVP</p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          A community-first digital adda for Telugu Gen Z conversations that become real-world plans.
        </h1>
        <p className="max-w-3xl text-base text-muted md:text-lg">
          English interface, Telugu-first culture. No vanity metrics, no algorithmic feed, just meaningful daily community interactions.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-surface p-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Authentication</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Phone OTP (India-first)</li>
            <li>Unique username</li>
            <li>Required city selection</li>
            <li>Optional age range</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Forum behavior</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Text posts + 1-level comments</li>
            <li>Sort by New / Active</li>
            <li>Chronological + lightweight ranking</li>
            <li>Reactions: {reactions.join(' ')}</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Safety</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Report posts/comments</li>
            <li>Manual moderator tools</li>
            <li>New-user rate limits</li>
            <li>Auto-hide after multiple reports</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">MVP success</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {successMetrics.map((metric) => (
              <li key={metric}>{metric}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Forum categories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.entries(forumCategories) as Array<[keyof typeof forumCategories, readonly string[]]>).map(
            ([name, topics]) => (
              <ForumCategoryCard key={name} name={name} topics={topics} />
            )
          )}
        </div>
      </section>
    </main>
  );
}
