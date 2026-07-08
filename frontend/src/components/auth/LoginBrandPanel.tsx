import { ShieldCheck } from 'lucide-react'

import { DostBrand } from './DostBrand'

export function LoginBrandPanel() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden bg-[#073b82] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:30px_30px]"
      />

      <DostBrand className="relative z-10" inverted />

      <div className="relative z-10 max-w-lg">
        <h1 className="max-w-md text-4xl font-black leading-tight xl:text-5xl">
          Secure access for GIA and SETUP proponents.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">
          Submit proposals, receive official updates, and manage DOST-assisted
          projects through one secure government portal.
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-blue-100">
          <ShieldCheck className="size-5 text-[#f4c542]" />
          Registered proponents and authorized DOST users only
        </div>
      </div>

      <p className="relative z-10 text-xs font-semibold text-blue-200">
        &copy; {new Date().getFullYear()} Department of Science and Technology
      </p>
    </section>
  )
}
