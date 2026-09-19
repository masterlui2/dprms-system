/**
 * System: DPRMS
 * Purpose: Render animated section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

type AnimatedSectionProps = PropsWithChildren<{
    className?: string;
    id?: string;
}>;

/** Render animated section and its available actions. */
export function AnimatedSection({
    children: objChildren,
    className: strClassName,
    id: strId,
}: AnimatedSectionProps)
{
    return (
        <motion.section
            className={strClassName}
            id={strId}
            initial={{ opacity: 0, y: 34 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            viewport={{ amount: 0.18, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
        >
            {objChildren}
        </motion.section>
    );
}
