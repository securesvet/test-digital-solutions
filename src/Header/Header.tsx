import Input from "../SearchInput/SearchInput";
import { FaArrowUp, FaFilter } from "react-icons/fa";
import { useContext, useState } from "react";
import { SortContext } from "../context";
import "./Header.css";

const Header = () => {
    const { sortOrder, setSortOrder } = useContext(SortContext);
    const [isRevealed, reveal] = useState(false);
    const handleChangeSortOrder = () => {
        setSortOrder(() => sortOrder === "asc" ? "desc" : "asc");
    };
    return (
        <div className="header">
            <Input />
            <button
                className="filter__button"
                onClick={() => reveal((p) => !p)}
            >
                <FaFilter />
            </button>
            {isRevealed && (
                <button
                    className="sort__button"
                    onClick={handleChangeSortOrder}
                >
                    {sortOrder === "asc"
                        ? <FaArrowUp />
                        : <FaArrowUp style={{ transform: "rotate(180deg)" }} />}
                </button>
            )}
        </div>
    );
};

export default Header;
