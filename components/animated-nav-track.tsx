"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type NavTrackItem = { href: string; label: string };

/** Menu bar background */
const MENU_BG = "#fe7d00";
/** Active item highlight */
const ACTIVE_COLOR = "#fb4402";

/**
 * Pill-shaped track with a sliding orange highlight (reference-style motion).
 * Labels stay on one line via whitespace-nowrap; track can scroll horizontally on narrow viewports.
 */
export function AnimatedNavTrack({
  items,
  className = "",
  size = "md"
}: {
  items: NavTrackItem[];
  className?: string;
  /** Slightly tighter padding for language toggles */
  size?: "sm" | "md";
}) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = (() => {
    let best = -1;
    let bestLen = -1;
    items.forEach((item, i) => {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (item.href.length > bestLen) {
          bestLen = item.href.length;
          best = i;
        }
      }
    });
    return best;
  })();

  const updateIndicator = useCallback(() => {
    const inner = innerRef.current;
    const el = linkRefs.current[activeIndex];
    if (!inner || !el || activeIndex < 0) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    setIndicator({
      left: el.offsetLeft,
      width: el.offsetWidth
    });
  }, [activeIndex, items]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, pathname, items]);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const innerEl = innerRef.current;
    if (!scrollEl || !innerEl) return;
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(scrollEl);
    ro.observe(innerEl);
    const onScroll = () => updateIndicator();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateIndicator);
    return () => {
      ro.disconnect();
      scrollEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  linkRefs.current = linkRefs.current.slice(0, items.length);

  if (items.length === 0) return null;

  const pad = size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs sm:text-[13px]";
  const bubbleTop = size === "sm" ? -5 : -6;

  return (
    <div
      ref={scrollRef}
      className={`max-w-full overflow-x-auto overflow-y-visible scroll-smooth rounded-full border border-black/10 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] [&::-webkit-scrollbar]:h-0 ${className}`}
      style={{ backgroundColor: MENU_BG }}
    >
      <div ref={innerRef} className="relative flex min-w-max flex-nowrap items-stretch">
        {/* Sliding highlight — positioned inside scrolling row so it moves with links */}
        <div
          className="pointer-events-none absolute left-0 top-1 z-0 h-[calc(100%-0.5rem)] rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
          style={{
            width: Math.max(indicator.width, 0),
            transform: `translateX(${indicator.left}px)`,
            opacity: activeIndex >= 0 && indicator.width > 0 ? 1 : 0,
            backgroundColor: ACTIVE_COLOR
          }}
          aria-hidden
        />
        {/* “Pop” orb — reference-style accent */}
        {activeIndex >= 0 && indicator.width > 0 && (
          <div
            className="pointer-events-none absolute z-20 h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(251,68,2,0.85)] ring-2 ring-white/50 transition-[left,opacity] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
            style={{
              backgroundColor: ACTIVE_COLOR,
              left: indicator.left + indicator.width / 2,
              top: bubbleTop,
              transform: "translateX(-50%)",
              opacity: 1
            }}
            aria-hidden
          />
        )}
        {items.map((item, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={item.href}
              ref={el => {
                linkRefs.current[i] = el;
              }}
              href={item.href}
              className={`relative z-10 shrink-0 whitespace-nowrap rounded-full ${pad} font-semibold tracking-tight transition-colors duration-300 ${
                active
                  ? "text-white drop-shadow-sm"
                  : "text-white/95 hover:text-white"
              } `}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
