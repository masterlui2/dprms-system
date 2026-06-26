import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

type AnimatedSectionProps = PropsWithChildren<{
  className?: string
  id?: string
}>

export function AnimatedSection({ children, className, id }: AnimatedSectionProps) {
  return (
    <motion.section
      className={className}
      id={id}
      initial={{ opacity: 0, y: 34 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      viewport={{ amount: 0.18, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.section>
  )
}
