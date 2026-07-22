import { Link } from "react-router-dom";

import heroImage from "../../assets/newhero.png";
import { getProgramRegistrationUrl } from "../../lib/programAccess";

export function HeroSection() {
  return (
    <section id="home" className="bg-white">
      <div className="relative overflow-hidden bg-white">
        <img
          alt="DOST GIA and SETUP proposal portal hero"
          className="h-auto w-full"
          src={heroImage}
        />
        <div className="absolute inset-x-0 bottom-5 z-10 flex flex-col items-center justify-center gap-3 px-4 sm:bottom-10 sm:flex-row sm:justify-start sm:px-8 lg:bottom-27 lg:px-28 xl:bottom-20">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/70 bg-[#f4c542] px-5 text-sm font-black text-[#073b82] shadow-2xl shadow-amber-900/25 ring-4 ring-white/45 transition hover:-translate-y-0.5 hover:bg-[#ffd45f] sm:h-14 sm:rounded-xl sm:px-7 sm:text-base"
            to={getProgramRegistrationUrl("GIA")}
          >
            Submit GIA Proposal
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/70 bg-white px-5 text-sm font-black text-[#073b82] shadow-2xl shadow-blue-900/20 ring-4 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-50 sm:h-14 sm:rounded-xl sm:px-7 sm:text-base"
            to={getProgramRegistrationUrl("SETUP")}
          >
            Register SETUP Proposal
          </Link>
        </div>
      </div>
    </section>
  );
}
