export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-muted">{children}</span>;
}
