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
import { SearchContext, SortContext } from "../context";
import {
    arrayMove,
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
    return i;
};

// TODO: Implement search

// TODO: Fix other occurring bugs because of ID and virtualization

function VirtualList() {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const startIndex = Math.max(
        0,
        Math.floor(
            (parentRef.current?.scrollTop || 0) / ITEM_HEIGHT,
        ) - OVERSCAN,
    );
    const { searchValue } = useContext(SearchContext);
    const [items, setItems] = useState<ItemType[]>([]);
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
            const length = endIndex - startIndex + OVERSCAN;
            if (length <= 0) return [];

            if (searchValue) {
                console.log(searchValue);
                const result: ItemType[] = [];
                let count = 0;
                for (let i = Number(searchValue); i < AMOUNT_OF_ITEMS; i++) {
                    const isArrayFull =
                        result.length >= AMOUNT_OF_VISIBLE_ITEMS;
                    const isInsideVisibleRange =
                        count >= startIndex - OVERSCAN &&
                        count <= endIndex + OVERSCAN;
                    if (isArrayFull || !isInsideVisibleRange) {
                        break;
                    } else {
                        count++;
                        if (i.toString().includes(searchValue.toLowerCase())) {
                            result.push({
                                id: i,
                                sortOrderId: getSortOrderID(i),
                                text: String(i),
                            });
                        }
                    }
                }
                return result;
            }

            return Array.from({ length }, (_, i) => {
                return {
                    id: startIndex + i,
                    sortOrderId: getSortOrderID(startIndex + i),
                    text: String(startIndex + i + 1),
                };
            });
        },
        [searchValue],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

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
            }
        }
    };
    const handleChangeItemsOrder = (
        { oldIndex, newIndex }: { oldIndex: number; newIndex: number },
    ) => {
        setItems((prevItems) => {
            const sorted = [...prevItems].sort((a, b) =>
                a.sortOrderId - b.sortOrderId
            );

            const fromIndex = sorted.findIndex((item) => item.id === oldIndex);
            const toIndex = sorted.findIndex((item) => item.id === newIndex);

            if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
                return prevItems;
            }

            const [movedItem] = sorted.splice(fromIndex, 1);

            const insertAt = toIndex + (fromIndex < toIndex ? 0 : 1);
            sorted.splice(insertAt, 0, movedItem);

            sorted.forEach((item, idx) => {
                item.sortOrderId = idx;
                itemsSortOrderInfo.set(item.id, idx);
            });

            return sorted;
        });
    };

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
    }, [searchValue, getItems, rowVirtualizer.calculateRange]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
                >
                    <div
                        className="virtual-list__spacer"
                        style={{ height: itemsCount * ITEM_HEIGHT }}
                    >
                        {items.sort((a, b) => a.sortOrderId - b.sortOrderId)
                            .map(
                                (item, index) => {
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
                                                text={JSON.stringify(item.text)}
                                                className={clsx(
                                                    index % 2 === 0
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
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        height: ITEM_HEIGHT,
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
