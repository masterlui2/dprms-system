import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const buttonVariants = cva(
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#0f53b7] text-white shadow-lg shadow-blue-900/20 hover:bg-[#0b3f8b] focus-visible:ring-blue-200',
        outline: 'border border-slate-300 bg-white text-[#07195f] hover:border-[#0f53b7] hover:text-[#0f53b7] focus-visible:ring-blue-100',
        secondary: 'bg-[#f4c542] text-[#07195f] shadow-lg shadow-amber-900/10 hover:bg-[#eab92d] focus-visible:ring-amber-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
