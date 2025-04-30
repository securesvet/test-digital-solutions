import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import "./VirtualList.css";
import clsx from "clsx";

const AMOUNT_OF_ITEMS = 1_000_000;
const WINDOW_HEIGHT = 400;
const ITEM_HEIGHT = 20;

const CHECKED_KEY = "virtualList_checkedItems";
const SCROLL_KEY = "virtualList_scrollTop";

function VirtualList() {
    const parentRef = useRef<HTMLDivElement | null>(null);

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

    const toggleCheckbox = useCallback((index: number) => {
        setCheckedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: AMOUNT_OF_ITEMS,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ITEM_HEIGHT,
    });

    return (
        <DndContext>
            <div
                ref={parentRef}
                className="list__container"
                style={{
                    height: WINDOW_HEIGHT,
                    overflow: "auto",
                    borderRadius: "10px",
                }}
            >
                <div
                    style={{
                        height: rowVirtualizer.getTotalSize(),
                        width: "100%",
                        position: "relative",
                    }}
                >
                    <SortableContext items={["a"]}>
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                            <div
                                key={virtualItem.key}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: virtualItem.size,
                                    transform:
                                        `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <RowItem
                                    index={virtualItem.index}
                                    checked={checkedItems.has(
                                        virtualItem.index,
                                    )}
                                    onToggle={toggleCheckbox}
                                />
                            </div>
                        ))}
                    </SortableContext>
                </div>
            </div>
        </DndContext>
    );
}

const RowItem = ({
    index,
    checked,
    onToggle,
}: {
    index: number;
    checked: boolean;
    onToggle: (index: number) => void;
}) => {
    return (
        <div
            className={clsx("virtual-list__item", index % 2 === 0 ? "virtual-list__item--even" : "virtual-list__item--odd")}
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
            Row {index}
        </div>
    );
};

export default VirtualList;
