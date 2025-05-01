import { useContext, useEffect, useState } from "react";
import { SearchContext } from "../context";

function Input() {
    const { searchValue, setSearchValue } = useContext(SearchContext);
    const [localValue, setLocalValue] = useState(searchValue);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchValue(localValue);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [localValue, setSearchValue]);

    useEffect(() => {
        setLocalValue(searchValue);
    }, [searchValue]);

    return (
        <input
            onChange={(e) => setLocalValue(e.target.value)}
            value={localValue}
            type="text"
            className="search-input"
            placeholder="Search..."
        />
    );
}

export default Input;
