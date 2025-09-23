import { motion } from 'framer-motion';
import React from 'react';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20 // Começa um pouco abaixo
    },
    in: {
        opacity: 1,
        y: 0 // Move para a posição final
    },
    out: {
        opacity: 0,
        y: -20 // Move um pouco para cima ao sair
    }
};

const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 1.0
};

export function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
        >
            {children}
        </motion.div>
    );
}