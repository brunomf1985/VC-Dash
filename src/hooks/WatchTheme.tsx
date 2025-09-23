import { useEffect, useState } from 'react';

export function useWatchTheme() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const handleClassChange = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        const observer = new MutationObserver(handleClassChange);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        handleClassChange();
        return () => observer.disconnect();
    }, []);

    return { isDarkMode };
};