import { createContext, useEffect, useState } from "react";

const CHECKED_KEY = "virtualList_checkedItems";

type CheckedItemsType = {
    checkedItems: Set<number>;
    toggleCheckedItem: (id: number) => void;
};
export const CheckedItemsContext = createContext<
    CheckedItemsType
>(
    null as unknown as CheckedItemsType,
);

export const CheckedItemsProvider = (
    { children }: { children: React.ReactNode },
) => {
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

    useEffect(() => {
        const savedChecked = localStorage.getItem(CHECKED_KEY);
        if (savedChecked) {
            try {
                const parsed = JSON.parse(savedChecked);
                setCheckedItems(new Set(parsed));
            } catch {
                console.error("Failed to parse checked items");
            }
        }
    }, []);

    const toggleCheckedItem = (id: number) => {
        setCheckedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            localStorage.setItem(
                CHECKED_KEY,
                JSON.stringify(Array.from(newSet)),
            );
            return newSet;
        });
    };

    return (
        <CheckedItemsContext.Provider
            value={{ checkedItems, toggleCheckedItem }}
        >
            {children}
        </CheckedItemsContext.Provider>
    );
};
