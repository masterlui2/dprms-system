import type { ReactNode } from "react";

interface FormSectionProps {
  children: ReactNode;
  description: string;
  title: string;
}

export function FormSection({
  children,
  description,
  title,
}: FormSectionProps) {
  return (
    <section className="border-t border-slate-200 pt-7 first:border-t-0 first:pt-0">
      <div className="mb-5">
        <h3 className="text-base font-black text-[#073b82]">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
