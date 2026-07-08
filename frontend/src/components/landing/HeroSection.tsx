import { Link } from "react-router-dom";

import heroImage from "../../assets/newhero.png";

export function HeroSection() {
  return (
    <section id="home" className="bg-white">
      <div className="relative overflow-hidden bg-white">
        <img
          alt="DOST MSME Monitoring Portal hero showing Filipino MSME entrepreneurs"
          className="h-auto w-full"
          src={heroImage}
        />
        <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center px-4 sm:bottom-10 sm:justify-start sm:px-8 lg:bottom-27 lg:px-25 xl:bottom-20">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/70 bg-[#f4c542] px-5 text-sm font-black text-[#073b82] shadow-2xl shadow-amber-900/25 ring-4 ring-white/45 transition hover:-translate-y-0.5 hover:bg-[#ffd45f] sm:h-14 sm:rounded-xl sm:px-7 sm:text-base"
            to="/proposal"
          >
            Submit Proposal
          </Link>
        </div>
      </div>
    </section>
  );
}
