"use client";

import { useState, useEffect } from "react";

export default function FloatingWhatsAppButton() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [moved, setMoved] = useState(false);
  const BUTTON_SIZE = 64; // px, matches w-16 h-16

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setMoved(false); // reset
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // threshold biar gak sensitif
    const deltaX = Math.abs(newX - position.x);
    const deltaY = Math.abs(newY - position.y);

    if (deltaX > 5 || deltaY > 5) {
      setMoved(true);
    }

    setPosition(({ x: _prevX, y: _prevY }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const minX = -vw + 48;
      const maxX = vw - 48;
      const minY = -vh + 48;
      const maxY = vh - 48;
      return {
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      };
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setIsDragging(true);
    setMoved(false);
    setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const t = e.touches[0];
    if (!t) return;

    const newX = t.clientX - dragStart.x;
    const newY = t.clientY - dragStart.y;

    const deltaX = Math.abs(newX - position.x);
    const deltaY = Math.abs(newY - position.y);
    if (deltaX > 5 || deltaY > 5) setMoved(true);

    setPosition(({ x: _prevX, y: _prevY }) => {
      // clamp to viewport so button stays visible
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const minX = -vw + 48; // allow some offscreen margin
      const maxX = vw - 48;
      const minY = -vh + 48;
      const maxY = vh - 48;
      return {
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      };
    });

    // prevent page scroll while dragging
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  // On mount, try to detect any fixed bottom navbar and position the button above it
  useEffect(() => {
    // don't override if user already moved the button
    if (position.x !== 0 || position.y !== 0) return;

    let offset = 0;
    const selectors = ["nav", "[role=\"navigation\"]", ".navbar", "header"];
    selectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const style = window.getComputedStyle(el);
      if (style.position === "fixed") {
        const rect = el.getBoundingClientRect();
        // consider elements anchored to bottom
        if (rect.bottom >= window.innerHeight - 1) {
          offset = Math.max(offset, rect.height + Math.abs(parseFloat(style.bottom) || 0));
        }
      }
    });

    if (offset === 0) {
      // fallback: scan for any fixed elements touching bottom
      const all = Array.from(document.querySelectorAll("*"));
      all.forEach((el) => {
        const style = window.getComputedStyle(el as Element);
        if (style.position === "fixed") {
          const rect = (el as Element).getBoundingClientRect();
          if (rect.bottom >= window.innerHeight - 4) {
            offset = Math.max(offset, rect.height);
          }
        }
      });
    }

    if (offset > 0) {
      setPosition((p) => ({ ...p, y: -(offset + 12) }));
    } else {
      // Try safe-area inset fallback (iOS)
      try {
        const safeInset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
        if (safeInset > 0) setPosition((p) => ({ ...p, y: -(safeInset + 12) }));
      } catch (err) {
        // ignore
      }
    }
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 cursor-grab active:cursor-grabbing touch-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <a
        href="https://wa.me/628123456789?text=Halo%20saya%20ingin%20bertanya%20tentang%20UMKM%20Anda"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (moved) {
            e.preventDefault(); // cegah buka WA saat drag
          }
        }}
        className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        <svg
          className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </a>
    </div>
  );
}