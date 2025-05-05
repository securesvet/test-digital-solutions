// context/SortOrderContext.tsx
import { createContext, useEffect, useState } from "react";

const SORT_ORDER_KEY = "virtualList_sortOrder";

export type SortOrderMap = Map<number, number>;

export const SortOrderContext = createContext<
  {
    sortOrder: SortOrderMap;
    updateSortOrder: (updates: SortOrderMap) => void;
    setSortOrderForItem: (id: number, order: number) => void;
  } | null
>(null);

export const SortOrderProvider = (
  { children }: { children: React.ReactNode },
) => {
  const [sortOrder, setSortOrder] = useState<SortOrderMap>(new Map());

  useEffect(() => {
    const saved = localStorage.getItem(SORT_ORDER_KEY);
    if (saved) {
      try {
        const parsedObj: [number, number][] = JSON.parse(saved);
        setSortOrder(new Map(parsedObj));
      } catch {
        console.error("Failed to parse saved sort order");
      }
    }
  }, []);

  const persist = (map: SortOrderMap) => {
    localStorage.setItem(
      SORT_ORDER_KEY,
      JSON.stringify(Array.from(map.entries())),
    );
  };

  const updateSortOrder = (newMap: SortOrderMap) => {
    setSortOrder(new Map(newMap));
    persist(newMap);
  };

  const setSortOrderForItem = (id: number, order: number) => {
    setSortOrder((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, order);
      persist(newMap);
      return newMap;
    });
  };

  return (
    <SortOrderContext.Provider
      value={{ sortOrder, updateSortOrder, setSortOrderForItem }}
    >
      {children}
    </SortOrderContext.Provider>
  );
};
