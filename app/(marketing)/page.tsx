import Link from "next/link";
import type { ReactNode } from "react";

// Public landing page. It's a server component on purpose: no state, no
// Convex calls, so it loads fast and works before anyone signs in.

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Explore skills", href: "#explore-skills" },
  { label: "About", href: "#about" },
];

const steps = [
  {
    title: "Create your profile",
    text: "Add the skills you can teach and the ones you want to learn.",
    icon: <UserIcon />,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Get matched",
    text: "SkillMatch finds people whose skills complement yours.",
    icon: <SearchIcon />,
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    title: "Connect",
    text: "Send an exchange request and wait for them to accept.",
    icon: <SendIcon />,
    color: "bg-sky-50 text-sky-600",
  },
  {
    title: "Learn and teach",
    text: "Schedule a video session and share what you know.",
    icon: <CapIcon />,
    color: "bg-emerald-50 text-emerald-600",
  },
];

// Example categories for the landing page only, not the real skill list.
const categories = [
  {
    title: "Programming and Technology",
    examples: "Web development, Python, data basics",
    icon: <CodeIcon />,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Languages",
    examples: "Spanish, English, conversation practice",
    icon: <ChatIcon />,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Design and Creativity",
    examples: "Graphic design, UI design, photography",
    icon: <PenIcon />,
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    title: "Business and Professional Skills",
    examples: "Public speaking, marketing, interviews",
    icon: <BriefcaseIcon />,
    color: "bg-sky-50 text-sky-600",
  },
  {
    title: "Music and Arts",
    examples: "Guitar, piano, drawing",
    icon: <MusicIcon />,
    color: "bg-rose-50 text-rose-600",
  },
  {
    title: "Personal Development",
    examples: "Cooking, fitness, study habits",
    icon: <SparkIcon />,
    color: "bg-emerald-50 text-emerald-600",
  },
];

const benefits = [
  {
    title: "Learn from real people",
    text: "Get help from someone who already knows the skill and can explain it in a simple way.",
    icon: <UsersIcon />,
  },
  {
    title: "Share what you already know",
    text: "Everyone is good at something. Teaching it is a great way to help others and practice.",
    icon: <HeartIcon />,
  },
  {
    title: "Find complementary skills",
    text: "Matches are based on what you teach and what you want to learn, so both sides benefit.",
    icon: <SwapIcon />,
  },
  {
    title: "Schedule sessions together",
    text: "Pick a time that works for both of you and meet in a live video session.",
    icon: <CalendarIcon />,
  },
];

const primaryButton =
  "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export default function MarketingHomePage() {
  return (
    <div className="flex-1 bg-white font-sans text-zinc-900">
      <Header />

      <main>
        <Hero />
        <HowItWorks />
        <ExploreSkills />
        <WhySkillMatch />
        <FinalCallToAction />
      </main>

      <Footer />
    </div>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-lg text-xl font-bold text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <SwapIcon />
      </span>
      SkillMatch
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in" className={`${secondaryButton} px-5 py-2.5`}>
            Log in
          </Link>
          <Link href="/sign-up" className={`${primaryButton} px-5 py-2.5`}>
            Sign up
          </Link>
        </div>

        {/* <details> gives us a keyboard-friendly mobile menu without any JavaScript. */}
        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open menu</span>
            <MenuIcon />
          </summary>

          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
            <nav aria-label="Mobile" className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3">
              <Link href="/sign-in" className={`${secondaryButton} py-2`}>
                Log in
              </Link>
              <Link href="/sign-up" className={`${primaryButton} py-2`}>
                Sign up
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-indigo-600">Learn</span> something.
            <br />
            <span className="text-violet-600">Teach</span> something.
            <br />
            Change lives.
          </h1>

          <p className="mt-6 max-w-lg text-lg text-zinc-600">
            SkillMatch connects people who want to learn with people who have
            something valuable to teach.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {/* Discover is protected, so signed-out visitors go to sign in first. */}
            <Link href="/discover" className={primaryButton}>
              Find someone to learn from
            </Link>
            <Link href="/sign-up" className={secondaryButton}>
              Share your skills
            </Link>
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}

// Two people, the skill each one teaches, and the match between them.
function HeroIllustration() {
  return (
    <div
      role="img"
      aria-label="Illustration of two people matched to exchange skills: one teaches React and the other teaches Spanish."
      className="relative mx-auto aspect-square w-full max-w-md"
    >
      <div className="absolute inset-6 rounded-full bg-violet-100/50 blur-2xl" />

      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M120 150 C 160 200, 190 190, 200 200"
          stroke="#818cf8"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M200 200 C 230 230, 250 240, 285 250"
          stroke="#34d399"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M95 230 C 120 330, 240 340, 280 300"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
      </svg>

      <Person className="left-[6%] top-[6%] bg-violet-100 text-violet-400" />
      <Person className="bottom-[6%] right-[6%] bg-emerald-100 text-emerald-400" />

      <div className="absolute right-[4%] top-[10%] rounded-2xl bg-indigo-50 px-4 py-3 shadow-sm ring-1 ring-indigo-100">
        <p className="text-xs font-medium text-indigo-600">Teaches</p>
        <p className="mt-1 flex items-center gap-2 font-semibold">
          <CodeIcon /> React
        </p>
      </div>

      <div className="absolute bottom-[12%] left-[4%] rounded-2xl bg-amber-50 px-4 py-3 shadow-sm ring-1 ring-amber-100">
        <p className="text-xs font-medium text-amber-600">Teaches</p>
        <p className="mt-1 flex items-center gap-2 font-semibold">
          <ChatIcon /> Spanish
        </p>
      </div>

      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-lg ring-8 ring-white">
        MATCH
      </div>
    </div>
  );
}

function Person({ className }: { className: string }) {
  return (
    <div
      className={`absolute flex h-[38%] w-[38%] items-end justify-center overflow-hidden rounded-full ring-8 ring-white ${className}`}
    >
      <svg viewBox="0 0 120 120" className="h-[85%] w-[85%]" fill="currentColor" aria-hidden="true">
        <circle cx="60" cy="44" r="24" />
        <path d="M14 120c4-30 22-46 46-46s42 16 46 46z" />
      </svg>
    </div>
  );
}

function SectionHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-zinc-600">{text}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm sm:p-12">
        <SectionHeading
          title="How SkillMatch works"
          text="A simple path from signing up to your first learning session."
        />

        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${step.color}`}
              >
                {step.icon}
              </div>
              <h3 className="mt-5 font-semibold">
                <span className="mr-2 text-indigo-600">{index + 1}.</span>
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ExploreSkills() {
  return (
    <section id="explore-skills" className="scroll-mt-20 bg-zinc-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Explore skills"
          text="A few examples of what people can learn and teach on SkillMatch."
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li
              key={category.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.color}`}
              >
                {category.icon}
              </div>
              <h3 className="mt-4 font-semibold">{category.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">
                For example: {category.examples}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WhySkillMatch() {
  return (
    <section id="about" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Why SkillMatch"
          text="SkillMatch is a skill exchange: you teach what you know and learn what you need from other members."
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {benefit.icon}
              </div>
              <div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{benefit.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCallToAction() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-14 text-center text-white sm:px-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to start your skill exchange?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-indigo-100">
          Create your profile, add your skills, and find someone to learn with.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Create your profile
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-100 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-zinc-500">Learn. Teach. Connect.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-zinc-900">
              {link.label}
            </a>
          ))}
          <Link href="/sign-in" className="hover:text-zinc-900">
            Log in
          </Link>
          <Link href="/sign-up" className="hover:text-zinc-900">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}

// Small inline icons (no icon library is installed).

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function UserIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </Icon>
  );
}

function UsersIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.5 4 2.8 4 6" />
    </Icon>
  );
}

function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </Icon>
  );
}

function SendIcon() {
  return (
    <Icon>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </Icon>
  );
}

function CapIcon() {
  return (
    <Icon>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2 9 2 12 0v-5" />
    </Icon>
  );
}

function CodeIcon() {
  return (
    <Icon>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />
    </Icon>
  );
}

function ChatIcon() {
  return (
    <Icon>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </Icon>
  );
}

function PenIcon() {
  return (
    <Icon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Icon>
  );
}

function BriefcaseIcon() {
  return (
    <Icon>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </Icon>
  );
}

function MusicIcon() {
  return (
    <Icon>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Icon>
  );
}

function SparkIcon() {
  return (
    <Icon>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </Icon>
  );
}

function HeartIcon() {
  return (
    <Icon>
      <path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" />
    </Icon>
  );
}

function SwapIcon() {
  return (
    <Icon>
      <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
    </Icon>
  );
}

function CalendarIcon() {
  return (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </Icon>
  );
}

function MenuIcon() {
  return (
    <Icon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}
