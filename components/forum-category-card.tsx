import { forumCategories } from '@/lib/constants';

type CategoryName = keyof typeof forumCategories;

export function ForumCategoryCard({ name, topics }: { name: CategoryName; topics: readonly string[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5">
      <h2 className="text-lg font-semibold">{name}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {topics.map((topic) => (
          <li key={topic} className="rounded-lg bg-white/5 px-3 py-2">
            {topic}
          </li>
        ))}
      </ul>
    </section>
  );
}
