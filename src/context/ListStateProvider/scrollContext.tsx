// context/ScrollContext.tsx
import { createContext, useEffect, useState } from "react";

const SCROLL_KEY = "virtualList_scrollTop";

type ScrollType = {
    scrollTop: number;
    setScrollTop: (value: number) => void;
};

export const ScrollContext = createContext<ScrollType>(
    null as unknown as ScrollType,
);

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
    const [scrollTop, setScrollTopState] = useState(0);

    useEffect(() => {
        const savedScroll = localStorage.getItem(SCROLL_KEY);
        if (savedScroll) {
            const parsed = parseInt(savedScroll, 10);
            if (!isNaN(parsed)) {
                setScrollTopState(parsed);
            }
        }
    }, []);

    const setScrollTop = (value: number) => {
        localStorage.setItem(SCROLL_KEY, String(value));
        setScrollTopState(value);
    };

    return (
        <ScrollContext.Provider value={{ scrollTop, setScrollTop }}>
            {children}
        </ScrollContext.Provider>
    );
};
