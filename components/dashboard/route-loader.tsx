'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function RouteLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    // Reset loader when path or params change (navigation finished)
    useEffect(() => {
        setLoading(false);
    }, [pathname, searchParams]);

    // Global listener to catch navigation-triggering clicks
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            // Check if it's a valid internal link
            if (anchor && anchor.href && !anchor.href.includes('#') && !anchor.target) {
                const url = new URL(anchor.href);
                // Only show loader if navigating to a DIFFERENT internal page
                if (url.origin === window.location.origin && url.pathname !== pathname) {
                    setLoading(true);
                }
            }

            // Handle buttons that look like they might trigger a submit or navigation
            const button = target.closest('button');
            if (button && (
                button.getAttribute('type') === 'submit' ||
                button.classList.contains('navigation-trigger') ||
                button.innerText.toLowerCase().includes('continuer') ||
                button.innerText.toLowerCase().includes('valider')
            )) {
                // For buttons, we show it briefly to indicate "processing"
                // But we don't want to get stuck if no navigation happens
                // So we'll auto-clear after 3s as a safety guard
                setLoading(true);
                setTimeout(() => setLoading(false), 3000);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [pathname]);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-600 to-amber-400 font-bold z-[9999] origin-left shadow-[0_1px_10px_rgba(246,148,29,0.3)]"
                />
            )}
        </AnimatePresence>
    );
}
