import {
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
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
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SearchContext } from "../context/ListStateProvider/search";
import SortableRowItem from "./SortableRowItem";
import "./VirtualList.css";
import clsx from "clsx";
import { ScrollContext, SortOrderContext } from "../context/ListStateProvider";

const AMOUNT_OF_ITEMS = 1_000_000;
const WINDOW_HEIGHT = 400;
const ITEM_HEIGHT = 20;
const OVERSCAN = 10;
const AMOUNT_OF_VISIBLE_ITEMS = Math.ceil(WINDOW_HEIGHT / ITEM_HEIGHT) +
    2 * OVERSCAN;

type ItemType = {
    id: number;
    sortOrderId: number;
    text: string;
};

// TODO: Implement search

// TODO: Fix other occurring bugs because of ID and virtualization

function VirtualList() {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const { searchValue } = useContext(SearchContext);
    const [items, setItems] = useState<ItemType[]>([]);
    const { sortOrder, setSortOrderForItem } = useContext(SortOrderContext)!;
    const [activeItemId, setActiveItemId] = useState(null);
    const { scrollTop, setScrollTop } = useContext(ScrollContext);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop); // Updates state + localStorage
    };

    const getSortOrderID = (id: number) => {
        return sortOrder.get(id) ?? id;
    };

    const startIndex = Math.max(
        0,
        Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
    );
    const endIndex = Math.min(
        AMOUNT_OF_ITEMS - 1,
        startIndex + AMOUNT_OF_VISIBLE_ITEMS,
    );

    useLayoutEffect(() => {
        if (parentRef.current) {
            parentRef.current.scrollTop = scrollTop;
        }
    }, [scrollTop]);

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
            const length = endIndex - startIndex;
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
                        if (i.toString().includes(searchValue.toLowerCase())) {
                            const id = startIndex + i;
                            result.push({
                                id,
                                sortOrderId: getSortOrderID(id),
                                text: String(i),
                            });
                        }
                        count++;
                    }
                }
                return result;
            }

            const result = [
                ...Array.from({ length }, (_, i) => {
                    const id = startIndex + i;
                    if (activeItemId !== null && id == activeItemId) {
                        return null as unknown as ItemType;
                    }
                    return {
                        id,
                        sortOrderId: getSortOrderID(id),
                        text: String(id + 1),
                    };
                }).filter(Boolean),
            ];

            return activeItemId !== null
                ? [...result, {
                    id: activeItemId,
                    sortOrderId: getSortOrderID(activeItemId),
                    text: String(activeItemId + 1),
                }]
                : result;
        },
        [searchValue, activeItemId],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        console.log(active.id);
        setActiveItemId((_item) => active.id);
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
        console.log("oldIndex, newIndex", oldIndex, newIndex);

        const sorted = [...items].sort((a, b) => a.sortOrderId - b.sortOrderId);

        const fromIndex = sorted.findIndex((item) => item.id === oldIndex);
        const toIndex = sorted.findIndex((item) => item.id === newIndex);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return;
        }

        const [movedItem] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, movedItem);

        for (let i = 0; i < sorted.length; i++) {
            const item = sorted[i];
            setSortOrderForItem(item.id, i);
        }

        setItems([...sorted]);
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

    if (!itemsCount) {
        return <div>No Result</div>;
    }

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
                                                text={item.text}
                                                className={clsx(
                                                    item.sortOrderId % 2 === 0
                                                        ? "virtual-list__item--even"
                                                        : "virtual-list__item--odd",
                                                )}
                                                style={{ height: ITEM_HEIGHT }}
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

export default VirtualList;
