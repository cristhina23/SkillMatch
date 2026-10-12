import Link from "next/link";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Discover", href: "/discover" },
  { label: "Sessions", href: "/sessions" },
  { label: "Notifications", href: "/notifications" },
  { label: "Availability", href: "/availability" },
  { label: "Profile", href: "/profile" },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-sm md:hidden"
    >
      <div className="grid grid-cols-3 gap-1 px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
