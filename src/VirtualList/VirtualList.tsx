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
const AMOUNT_OF_VISIBLE_ITEMS = Math.ceil(WINDOW_HEIGHT / ITEM_HEIGHT);
const OVERSCAN = 10;

const CHECKED_KEY = "virtualList_checkedItems";
const SCROLL_KEY = "virtualList_scrollTop";

type ItemType = {
    id: number;
    text: string;
};

// TODO: Drag and drop selection fix.

// TODO: Implement search

// TODO: Fix other occurring bugs because of ID and virtualization

function VirtualList() {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const { searchValue } = useContext(SearchContext);
    const { sortOrder } = useContext(SortContext);
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
            const length = endIndex - startIndex + 1;
            if (length <= 0) return [];

            if (searchValue) {
                console.log(searchValue);
                const result: ItemType[] = [];
                let count = 0;
                for (let i = Number(searchValue); i < AMOUNT_OF_ITEMS; i++) {
                    const isArrayFull =
                        result.length >= AMOUNT_OF_VISIBLE_ITEMS + OVERSCAN;
                    const isInsideVisibleRange =
                        count >= startIndex - OVERSCAN &&
                        count <= endIndex + OVERSCAN;
                    if (isArrayFull || !isInsideVisibleRange) {
                        break;
                    } else {
                        count++;
                        if (i.toString().includes(searchValue.toLowerCase())) {
                            result.push({ id: i, text: String(i) });
                        }
                    }
                }
                return result;
            }

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
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over?.id);
            setItems((items) => arrayMove(items, oldIndex, newIndex));
        }
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
    }, [searchValue, sortOrder, getItems, rowVirtualizer.calculateRange]);

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
                        style={{ height: rowVirtualizer.getTotalSize() }}
                    >
                        {rowVirtualizer.getVirtualItems().map(
                            (virtualItem, i) => {
                                const item = items[i];
                                if (!item) return null;
                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            transform:
                                                `translateY(${virtualItem.start}px)`,
                                            position: "absolute",
                                            width: "100%",
                                        }}
                                    >
                                        <SortableRowItem
                                            id={item.id}
                                            checked={checkedItems.has(item.id)}
                                            onToggle={toggleCheckbox}
                                            text={item.text}
                                            className={clsx(
                                                i % 2 === 0
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
