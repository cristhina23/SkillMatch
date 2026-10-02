import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Discover", href: "/discover" },
  { label: "Profile", href: "/profile" },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-zinc-200 bg-white p-6 md:flex">
      <Link href="/dashboard" className="mb-10 text-2xl font-bold text-zinc-900">
        SkillMatch
      </Link>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-zinc-200 pt-6">
        <p className="text-xs text-zinc-400">Learn. Teach. Connect.</p>
      </div>
    </aside>
  );
}