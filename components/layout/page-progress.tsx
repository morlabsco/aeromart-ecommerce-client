"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/* ---------------------------------------------------------------------------
 * PageProgress — the thin primary line at the very top of the viewport that
 * runs during route changes (App Router has no router events, so this hooks
 * anchor clicks + pathname observation instead of a router callback).
 *
 * The motion is a "retention" trickle, not a steady linear crawl: it jumps
 * early, then takes successively smaller steps on a slowing clock (like
 * YouTube/GitHub), holding just under done until the navigation lands — then
 * snaps to 100% and fades out. transform-only so it stays compositor-smooth;
 * suppressed entirely for prefers-reduced-motion.
 * ------------------------------------------------------------------------- */

/** Percent jumps — each step is smaller than the last (the hook shape). */
const TRICKLE_STEPS = [30, 18, 12, 8, 5, 3, 2, 1.5, 1];
/** Delays between steps — growing, so progress feels fast then patient. */
const TRICKLE_DELAYS_MS = [180, 240, 300, 360, 420, 480, 540, 600];

export function PageProgress() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const progressRef = useRef(0);
    const barRef = useRef<HTMLDivElement | null>(null);
    const timersRef = useRef<number[]>([]);
    const navigatingRef = useRef(false);
    const reducedMotionRef = useRef(false);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach((t) => window.clearTimeout(t));
        timersRef.current = [];
    }, []);

    const paint = useCallback((value: number) => {
        progressRef.current = value;
        if (barRef.current) {
            barRef.current.style.transform = `scaleX(${Math.min(
                100,
                Math.max(0, value),
            ) / 100})`;
        }
    }, []);

    /** Jump-start, then trickle toward ~90% with decreasing step sizes. */
    const start = useCallback(() => {
        if (navigatingRef.current || reducedMotionRef.current) return;
        navigatingRef.current = true;
        setVisible(true);
        paint(8);

        let value = 8;
        TRICKLE_STEPS.forEach((step, i) => {
            const delay = TRICKLE_DELAYS_MS[i] ?? 650;
            const t = window.setTimeout(() => {
                // Cap the hold at 90% — the last 10% belongs to the real
                // navigation completing.
                value = Math.min(90, value + step);
                paint(value);
            }, delay);
            timersRef.current.push(t);
        });
    }, [paint]);

    /** Snap to done and fade out. */
    const finish = useCallback(() => {
        if (!navigatingRef.current) return;
        clearTimers();
        paint(100);
        navigatingRef.current = false;
        const t = window.setTimeout(() => {
            setVisible(false);
            paint(0);
        }, 220);
        timersRef.current.push(t);
    }, [clearTimers, paint]);

    // Reduced motion: never show the bar.
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => {
            reducedMotionRef.current = mq.matches;
        };
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Internal link clicks start the run (Next <Link>s render real anchors).
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                return;
            const target = (event.target as HTMLElement | null)?.closest?.(
                "a",
            ) as HTMLAnchorElement | null;
            if (!target) return;
            const href = target.getAttribute("href");
            if (!href || href.startsWith("#")) return;
            // External / mail / tel / new-tab targets don't navigate the app.
            if (target.target && target.target !== "_self") return;
            if (/^([a-z]+:)?\/\//i.test(href) && !href.startsWith(window.location.origin))
                return;
            if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
            const url = new URL(target.href, window.location.href);
            if (url.origin !== window.location.origin) return;
            // Same-URL clicks (e.g. logo on home) just reload — still show it.
            start();
        };
        document.addEventListener("click", onClick, { capture: true });
        return () =>
            document.removeEventListener("click", onClick, { capture: true });
    }, [start]);

    // A pathname change = the navigation landed → finish.
    useEffect(() => {
        finish();
    }, [pathname, finish]);

    // Browser back/forward while a run is pending also resolves it.
    useEffect(() => {
        const onPop = () => finish();
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, [finish]);

    // Safety: never leave the bar stuck if a navigation never resolves
    // (e.g. a download link or an aborted transition).
    useEffect(() => {
        if (!visible) return;
        const t = window.setTimeout(() => finish(), 10_000);
        timersRef.current.push(t);
        return () => window.clearTimeout(t);
    }, [visible, finish]);

    useEffect(() => clearTimers, [clearTimers]);

    if (typeof window !== "undefined" && reducedMotionRef.current) return null;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
        >
            <div
                ref={barRef}
                className="h-full w-full origin-left bg-primary"
                style={{
                    transform: "scaleX(0)",
                    transition: visible
                        ? "transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                        : "none",
                }}
            />
        </div>
    );
}
