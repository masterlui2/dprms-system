import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 grid size-11 place-items-center rounded-full bg-[#073b82] text-white shadow-lg shadow-blue-950/25 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0b4fb8] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 sm:size-12 ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
          : "pointer-events-none translate-y-4 opacity-0 scale-90"
      }`}
    >
      <ChevronUp className="size-5 stroke-[2.5]" />
    </button>
  );
}
