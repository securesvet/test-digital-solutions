import { useVirtualizer } from "@tanstack/react-virtual";
import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import "./VirtualList.css";
import clsx from "clsx";
import { SearchContext } from "../context";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GoGrabber } from "react-icons/go";

const AMOUNT_OF_ITEMS = 1_000_000;
const WINDOW_HEIGHT = 400;
const ITEM_HEIGHT = 20;
const OVERSCAN = 10;
const AMOUNT_OF_VISIBLE_ITEMS = Math.ceil(WINDOW_HEIGHT / ITEM_HEIGHT) +
    2 * OVERSCAN;

const CHECKED_KEY = "virtualList_checkedItems";
const SCROLL_KEY = "virtualList_scrollTop";
const ORDER_KEY = "virtualList_orderKey";

type ItemType = {
    id: number;
    sortOrderId: number;
    text: string;
};

type ItemsOrderType = {
    fromId: number;
    toId: number;
};

const itemsSortOrderInfo = new Map<number, number>();

const movedItemsID = new Set<number>();

const getSortOrderID = (i: number) => {
    if (itemsSortOrderInfo.has(i)) {
        return itemsSortOrderInfo.get(i)!;
    }
    return i;
};

// TODO: Implement search

// TODO: Fix other occurring bugs because of ID and virtualization

function VirtualList() {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const { searchValue } = useContext(SearchContext);
    const [items, setItems] = useState<ItemType[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [activeItemId, setActiveItemId] = useState(null);
    const [scrollTop, setScrollTop] = useState(0);
    const startIndex = Math.max(
        0,
        Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
    );
    const endIndex = Math.min(
        AMOUNT_OF_ITEMS - 1,
        startIndex + AMOUNT_OF_VISIBLE_ITEMS,
    );

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

    const toggleCheckbox = (id: number) => {
        setCheckedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const itemsCount = useMemo(() => {
        if (!searchValue) return AMOUNT_OF_ITEMS;
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
            console.log("rerenderItems");
            const length = endIndex - startIndex + OVERSCAN;
            if (length <= 0) return [];

            const result = [
                ...Array.from({ length }, (_, i) => {
                    const id = startIndex + i;
                    if (id == activeItemId) return null as unknown as ItemType;
                    return {
                        id,
                        sortOrderId: getSortOrderID(i),
                        text: String(id + 1),
                    };
                }).filter(Boolean),
            ];

            return activeItemId
                ? [...result, {
                    id: activeItemId,
                    sortOrderId: getSortOrderID(activeItemId),
                    text: String(activeItemId + 1),
                }]
                : result;

            // if (searchValue) {
            //     console.log(searchValue);
            //     const result: ItemType[] = [];
            //     let count = 0;
            //     for (let i = Number(searchValue); i < AMOUNT_OF_ITEMS; i++) {
            //         const isArrayFull =
            //             result.length >= AMOUNT_OF_VISIBLE_ITEMS;
            //         const isInsideVisibleRange =
            //             count >= startIndex - OVERSCAN &&
            //             count <= endIndex + OVERSCAN;
            //         if (isArrayFull || !isInsideVisibleRange) {
            //             break;
            //         } else {
            //             count++;
            //             if (i.toString().includes(searchValue.toLowerCase())) {
            //                 result.push({
            //                     id: i,
            //                     sortOrderId: getSortOrderID(i + startIndex),
            //                     text: String(i),
            //                 });
            //             }
            //         }
            //     }
            //     return result;
            // }
        },
        [searchValue, activeItemId],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        console.log(active.id);
        setActiveItemId(active.id);
        console.log(activeItemId);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const itemActive = items.find((item) => item.id === active.id);
            const itemOver = items.find((item) => item.id === over.id);
            if (itemActive && itemOver) {
                handleChangeItemsOrder({
                    oldIndex: itemActive.id,
                    newIndex: itemOver.id,
                });
                setActiveItemId(null);
            }
        }
    };

    const handleChangeItemsOrder = (
        { oldIndex, newIndex }: { oldIndex: number; newIndex: number },
    ) => {
        const sorted = [...items].sort((a, b) => a.sortOrderId - b.sortOrderId);

        const fromIndex = sorted.findIndex((item) => item.id === oldIndex);
        const toIndex = sorted.findIndex((item) => item.id === newIndex);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return items;
        }

        const [movedItem] = sorted.splice(fromIndex, 1);

        const insertAt = toIndex + (fromIndex < toIndex ? 0 : 1);
        sorted.splice(insertAt, 0, movedItem);

        sorted.forEach((item, idx) => {
            item.sortOrderId = idx;
            if (item.id !== idx) {
                itemsSortOrderInfo.set(item.id, idx);
            }
        });

        return sorted;
    };

    const handleUpdateLoadItems = (
        range: { startIndex: number; endIndex: number } | null,
    ) => {
        if (!range) return;
        const { startIndex, endIndex } = range;
        const updated = getItems(startIndex, endIndex);
        setItems(updated);
    };

    useEffect(() => {
        handleUpdateLoadItems({
            startIndex,
            endIndex,
        });
    }, [searchValue, startIndex, getItems]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setScrollTop(scrollTop);
        localStorage.setItem(SCROLL_KEY, String(scrollTop));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={parentRef}
                    className="list__container"
                    style={{ height: WINDOW_HEIGHT }}
                    onScroll={handleScroll}
                >
                    <div
                        className="virtual-list__spacer"
                        style={{ height: itemsCount * ITEM_HEIGHT }}
                    >
                        {items.sort((a, b) => a.sortOrderId - b.sortOrderId)
                            .map(
                                (item) => {
                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                transform: `translateY(${
                                                    startIndex * ITEM_HEIGHT
                                                }px)`,
                                            }}
                                        >
                                            <SortableRowItem
                                                id={item.id}
                                                checked={checkedItems.has(
                                                    item.id,
                                                )}
                                                onToggle={toggleCheckbox}
                                                text={item.text}
                                                className={clsx(
                                                    item.sortOrderId % 2 === 0
                                                        ? "virtual-list__item--even"
                                                        : "virtual-list__item--odd",
                                                )}
                                            />
                                        </div>
                                    );
                                },
                            )}
                    </div>
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableRowItem({
    id,
    checked,
    onToggle,
    text,
    className,
}: {
    id: number;
    checked: boolean;
    onToggle: (index: number) => void;
    text?: string;
    className?: string;
    active?: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        border: isDragging ? "2px solid cyan" : "",
        height: ITEM_HEIGHT,
        zIndex: isDragging ? 10001 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className={clsx("virtual-list__item", className)}
        >
            <GoGrabber className="grab" />
            <input
                className="virtual-list__item__checkbox"
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(id)}
            />
            <span>{text}</span>
        </div>
    );
}

export default VirtualList;
