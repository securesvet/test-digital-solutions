import { useVirtualizer } from "@tanstack/react-virtual";
import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { DndContext } from "@dnd-kit/core";
import "./VirtualList.css";
import clsx from "clsx";
import { SearchContext, SortContext } from "../context";

const AMOUNT_OF_ITEMS = 1_000_000;
const WINDOW_HEIGHT = 400;
const ITEM_HEIGHT = 20;
const AMOUNT_OF_VISIBLE_ITEMS = Math.ceil(WINDOW_HEIGHT / ITEM_HEIGHT);
const OVERSCAN = 10;

const CHECKED_KEY = "virtualList_checkedItems";
const SCROLL_KEY = "virtualList_scrollTop";

function VirtualList() {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const { searchValue } = useContext(SearchContext);
    const { sortOrder } = useContext(SortContext);
    const [items, setItems] = useState<{ id: number; text: string }[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    useEffect(() => {
        const savedChecked = localStorage.getItem(CHECKED_KEY);
        if (savedChecked) {
            try {
                const parsed = JSON.parse(savedChecked);
                setCheckedItems(new Set(parsed));
            } catch (e) {
                console.error("Failed to parse saved checkedItems");
            }
        }

        const savedScroll = localStorage.getItem(SCROLL_KEY);
        if (savedScroll && parentRef.current) {
            parentRef.current.scrollTop = parseInt(savedScroll, 10);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(
            CHECKED_KEY,
            JSON.stringify(Array.from(checkedItems)),
        );
    }, [checkedItems]);

    useEffect(() => {
        const handler = () => {
            if (parentRef.current) {
                localStorage.setItem(
                    SCROLL_KEY,
                    String(parentRef.current.scrollTop),
                );
            }
        };
        const el = parentRef.current;
        el?.addEventListener("scroll", handler);
        return () => el?.removeEventListener("scroll", handler);
    }, []);

    const toggleCheckbox = (index: number) => {
        setCheckedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const itemsCount = useMemo(() => {
        if (!searchValue) {
            return AMOUNT_OF_ITEMS;
        }
        let count = 0;
        for (let i = Number(searchValue); i < AMOUNT_OF_ITEMS; i++) {
            if (i.toString().includes(searchValue.toLowerCase())) {
                count++;
            }
        }
        return count;
    }, [searchValue]);

    const getItems = useCallback(
        (startIndex: number, endIndex: number) => {
            if (searchValue) {
                const result = [];
                let count = 0;
                for (let i = Number(searchValue); i < AMOUNT_OF_ITEMS; i++) {
                    const isArrayFull =
                        result.length >= AMOUNT_OF_VISIBLE_ITEMS + OVERSCAN;
                    const isInsideVisibleRange =
                        count >= startIndex - OVERSCAN &&
                        count <= endIndex + OVERSCAN;
                    if (isArrayFull || !isInsideVisibleRange) {
                        break;
                    }
                }
            }
            const length = endIndex - startIndex + 1;
            if (length <= 0) return [];

            if (sortOrder === "asc") {
                return Array.from({ length }, (_, i) => ({
                    id: startIndex + i,
                    text: String(startIndex + i + 1),
                }));
            } else {
                return Array.from({ length }, (_, i) => ({
                    id: AMOUNT_OF_ITEMS - 1 - startIndex - i,
                    text: String(AMOUNT_OF_ITEMS - startIndex - i),
                }));
            }
        },
        [sortOrder],
    );

    // const getFilteredItems = useCallback(
    //     (startIndex: number, endIndex: number) => {
    //         console.log("rerender filtered items", startIndex, endIndex);
    //         if (!searchValue) {
    //             return null;
    //         }
    //         let count = 0;
    // const result = [];
    // for (let i = Number(searchValue); i < AMOUNT_OF_ITEMS; i++) {
    //     const isArrayFull =
    //         result.length >= AMOUNT_OF_VISIBLE_ITEMS + OVERSCAN;
    //     const isInsideVisibleRange = count >= startIndex - OVERSCAN &&
    //         count <= endIndex + OVERSCAN;
    //     if (isArrayFull || !isInsideVisibleRange) {
    //         break;
    //     }
    //             console.log(count, isInsideVisibleRange);
    //             console.log(
    //                 "includes",
    //                 i.toString().includes(searchValue.toLowerCase()),
    //             );
    //             if (
    //                 i.toString().includes(searchValue.toLowerCase()) &&
    //                 isInsideVisibleRange
    //             ) {
    //                 result[count++] = i.toString();
    //             }
    //         }
    //         console.log(result);
    //         return result;
    //     },
    //     [searchValue],
    // );

    const rowVirtualizer = useVirtualizer({
        count: itemsCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ITEM_HEIGHT,
        onChange(instance) {
            handleUpdateLoadItems(instance.range);
        },
    });

    const handleUpdateLoadItems = (
        range: { startIndex: number; endIndex: number } | null,
    ) => {
        if (!range) return;
        const { startIndex, endIndex } = range;
        const updated = getItems(startIndex, endIndex);
        setItems(updated);
    };

    useEffect(() => {
        const range = rowVirtualizer.calculateRange();
        handleUpdateLoadItems(range);
    }, [sortOrder, getItems, rowVirtualizer.calculateRange]);

    return (
        <DndContext>
            <div
                ref={parentRef}
                className="list__container"
                style={{
                    height: WINDOW_HEIGHT,
                }}
            >
                <div
                    className="virtual-list__spacer"
                    style={{
                        height: rowVirtualizer.getTotalSize(),
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem, i) => (
                        <div
                            key={virtualItem.key}
                            className="virtual-list__row"
                            style={{
                                height: virtualItem.size,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <RowItem
                                checked={checkedItems.has(
                                    virtualItem.index,
                                )}
                                onToggle={toggleCheckbox}
                                text={items[i]?.text || ""}
                                className={clsx(
                                    "virtual-list__item",
                                    i % 2 === 0
                                        ? "virtual-list__item--even"
                                        : "virtual-list__item--odd",
                                )}
                                index={virtualItem.index}
                            />
                        </div>
                    ))};
                </div>
            </div>
        </DndContext>
    );
}

const RowItem = ({
    checked,
    onToggle,
    text,
    className,
    index,
}: {
    index: number;
    checked: boolean;
    onToggle: (index: number) => void;
    text?: string;
    className?: string;
}) => {
    return (
        <div
            className={clsx("virtual-list__item", className)}
            style={{
                height: ITEM_HEIGHT,
            }}
        >
            <input
                className="virtual-list__item__checkbox"
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(index)}
            />
            <span>{text}</span>
        </div>
    );
};

export default VirtualList;
