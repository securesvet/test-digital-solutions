import { useSortable } from "@dnd-kit/sortable";
import clsx from "clsx";
import { useContext } from "react";
import { GoGrabber } from "react-icons/go";
import { CSS } from "@dnd-kit/utilities";
import { CheckedItemsContext } from "../context/ListStateProvider/checkedItems";
import "./VirtualList.css";

function SortableRowItem({
    id,
    text,
    className,
    style,
}: {
    id: number;
    text?: string;
    className?: string;
    style?: React.CSSProperties;
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

    const { checkedItems, toggleCheckedItem } = useContext(CheckedItemsContext);

    const isChecked = checkedItems.has(id);

    const containerStyles = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        border: isDragging ? "2px solid cyan" : "",
        height: 30,
        zIndex: isDragging ? 10001 : -1,
        ...style,
    };

    return (
        <div
            style={containerStyles}
            ref={setNodeRef}
            className={clsx("virtual-list__item", className)}
            {...attributes}
        >
            <GoGrabber
                className="grab"
                {...listeners}
            />
            <input
                className="virtual-list__item__checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCheckedItem(id)}
            />
            <span>{text}</span>
        </div>
    );
}

export default SortableRowItem;
