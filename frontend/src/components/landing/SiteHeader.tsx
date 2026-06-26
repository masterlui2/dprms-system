import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";

import logoImage from "../../assets/logo2.png";
import { navigationItems } from "../../data/landing";

function TopBar() {
  return (
    <div className="bg-[#073b82] text-xs text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-[#f4c542]" />
          Republic of the Philippines - Department of Science and Technology
        </span>
        <span className="hidden font-semibold text-white/80 sm:inline">
          An official DOST digital service
        </span>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <a
      className="flex items-center"
      href="#home"
      aria-label="DOST MSME Monitoring Portal home"
    >
      <img
        alt="DOST MSME Monitoring Portal"
        className="h-14 w-auto max-w-[240px] object-contain sm:h-20"
        src={logoImage}
      />
    </a>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6e9f8] bg-white/90 backdrop-blur-md">
      <TopBar />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-[210px]">
          <Logo />
        </div>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {navigationItems.map((item) => (
            <a
              className="rounded-md px-3.5 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-[#eaf6ff] hover:text-[#073b82]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden min-w-[210px] items-center justify-end gap-2 lg:flex">
          <Link
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-[#073b82] transition-colors hover:bg-[#eaf6ff]"
            to="/login"
          >
            Sign In
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#073b82] to-[#0f6ed6] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-transform hover:-translate-y-0.5"
            to="/login"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          aria-label="Menu"
          className="rounded-md p-2 text-[#073b82] transition-colors hover:bg-[#eaf6ff] lg:hidden"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#d6e9f8] bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navigationItems.map((item) => (
              <a
                className="rounded-md px-3 py-3 text-sm font-bold text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#073b82] px-4 py-3 text-sm font-bold text-white"
              onClick={() => setOpen(false)}
              to="/login"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
