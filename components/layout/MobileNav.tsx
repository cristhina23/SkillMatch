import Link from "next/link";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Discover", href: "/discover" },
  { label: "Profile", href: "/profile" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-zinc-200 bg-white p-3 md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}