import React, { useState } from "react";
import "./VList.css";

const AMOUNT_OF_ITEMS = 1_000;
const WINDOW_HEIGHT = 400;
const ITEM_HEIGHT = 20;
const OVERSCAN = 10;
const AMOUNT_OF_VISIBLE_ITEMS = Math.ceil(WINDOW_HEIGHT / ITEM_HEIGHT) +
    2 * OVERSCAN;

const VList = () => {
    const [scrollTop, setScrollTop] = useState(0);
    const [items, setItems] = useState(
        Array.from({ length: 1000 }, (_, i) => i),
    );
    return (
        <ul className="container">
            {items.map((item, i) => (
                <p style={{ transform: `translateY(${i}px)` }}>{item}</p>
            ))}
        </ul>
    );
};

export default VList;
