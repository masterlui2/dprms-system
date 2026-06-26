import heroImage from "../../assets/knn.png";

export function HeroSection() {
  return (
    <section id="home" className="bg-white">
      <div className="relative h-[390px] overflow-hidden sm:h-[560px] lg:h-[640px] xl:h-[720px]">
        <img
          alt="DOST MSME Monitoring Portal hero showing Filipino MSME entrepreneurs"
          className="absolute inset-0 h-full w-full object-cover object-[center_135%]"
          src={heroImage}
        />
        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-4 sm:justify-start sm:px-8 lg:bottom-35 lg:px-16">
          <a
            className="inline-flex h-14 items-center justify-center rounded-xl border border-white/70 bg-[#f4c542] px-7 text-base font-black text-[#073b82] shadow-2xl shadow-amber-900/25 ring-4 ring-white/45 transition hover:-translate-y-0.5 hover:bg-[#ffd45f]"
            href="#proposal"
          >
            Submit Proposal
          </a>
        </div>
      </div>
    </section>
  );
}
