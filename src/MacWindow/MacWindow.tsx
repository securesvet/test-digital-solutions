import { ReactNode, useEffect, useRef, useState } from "react";
import "./MacWindow.css";

const STORAGE_KEY = "macWindow_position";

const MacWindow = ({ children }: { children?: ReactNode }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setPosition(JSON.parse(saved));
            } catch {
                setPosition({ x: 0, y: 0 });
            }
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        offsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        offsetRef.current = {
            x: e.touches[0].clientX - position.x,
            y: e.touches[0].clientY - position.y,
        };
    };

    const handleWindowMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const clientX = e instanceof MouseEvent
            ? e.clientX
            : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent
            ? e.clientY
            : e.touches[0].clientY;

        const newPosition = {
            x: clientX - offsetRef.current.x,
            y: clientY - offsetRef.current.y,
        };

        setPosition(newPosition);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosition));
    };

    const handleEndDrag = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleWindowMove);
        document.addEventListener("mouseup", handleEndDrag);
        document.addEventListener("touchmove", handleWindowMove, {
            passive: false,
        });
        document.addEventListener("touchend", handleEndDrag);

        return () => {
            document.removeEventListener("mousemove", handleWindowMove);
            document.removeEventListener("mouseup", handleEndDrag);
            document.removeEventListener("touchmove", handleWindowMove);
            document.removeEventListener("touchend", handleEndDrag);
        };
    }, [isDragging]);

    return (
        <div
            className="window"
            style={{
                position: "absolute",
                top: position.y,
                left: position.x,
                zIndex: 1000,
                touchAction: "none",
            }}
        >
            <header
                className="window-header"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="controls">
                    <div className="close"></div>
                    <div className="minimize"></div>
                    <div className="zoom"></div>
                </div>
                <p>
                    <a
                        href="https://mursvet.ru"
                        style={{ textDecoration: "none", color: "inherit" }}
                    >
                        mursvet.ru
                    </a>
                </p>
            </header>
            <section>{children}</section>
        </div>
    );
};

export default MacWindow;
