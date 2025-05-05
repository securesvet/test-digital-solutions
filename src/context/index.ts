import { createContext, type Dispatch, type SetStateAction } from "react";

type SearchContextType = {
    searchValue: string;
    setSearchValue: Dispatch<SetStateAction<string>>;
};

export const SearchContext = createContext(
    null as unknown as SearchContextType,
);