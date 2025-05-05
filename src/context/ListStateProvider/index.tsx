import { CheckedItemsContext, CheckedItemsProvider } from "./checkedItems";
import { SortOrderContext, SortOrderProvider } from "./sortOrder";
import { ScrollContext, ScrollProvider } from "./scrollContext";
import { SearchContext } from "./search";
import { useState } from "react";

export const ListStateProvider = (
    { children }: { children: React.ReactNode },
) => {
    const [searchValue, setSearchValue] = useState("");

    return (
        <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            <CheckedItemsProvider>
                <SortOrderProvider>
                    <ScrollProvider>
                        {children}
                    </ScrollProvider>
                </SortOrderProvider>
            </CheckedItemsProvider>
        </SearchContext.Provider>
    );
};

export { CheckedItemsContext, ScrollContext, SearchContext, SortOrderContext };
