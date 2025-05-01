import { createContext, type Dispatch, type SetStateAction } from "react";

type SearchContextType = {
    searchValue: string;
    setSearchValue: Dispatch<SetStateAction<string>>;
};

type SortContextType = {
    sortOrder: "asc" | "desc";
    setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
};

export const SearchContext = createContext(
    null as unknown as SearchContextType,
);

export const SortContext = createContext(
    null as unknown as SortContextType,
);
