import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── IntersectionObserver (Framer Motion whileInView) ───────
class IntersectionObserverMock implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(public callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) { }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// ─── ResizeObserver ─────────────────────────────────────────
class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// ─── matchMedia ─────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// ─── next-auth/react ────────────────────────────────────────
vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: null, status: 'unauthenticated' }),
    signIn: vi.fn(),
    signOut: vi.fn(),
    SessionProvider: ({ children }: any) => children,
}));

// ─── next/link ──────────────────────────────────────────────
vi.mock('next/link', () => ({
    default: ({ children, href, ...rest }: any) =>
        React.createElement('a', { href, ...rest }, children),
}));

// ─── next/navigation ────────────────────────────────────────
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// ─── framer-motion ──────────────────────────────────────────
const MOTION_PROP_NAMES = new Set([
    'initial', 'animate', 'exit', 'whileInView', 'whileHover', 'whileTap',
    'whileDrag', 'whileFocus', 'transition', 'variants', 'viewport',
    'layout', 'layoutId', 'drag', 'dragConstraints', 'dragElastic',
    'dragMomentum', 'dragTransition', 'onDragStart', 'onDragEnd', 'onDrag',
    'onAnimationStart', 'onAnimationComplete',
]);

vi.mock('framer-motion', () => {
    const handler: ProxyHandler<object> = {
        get(_target, tag: string) {
            // Return a component that renders the real HTML tag, stripping motion-only props
            const MotionComponent = React.forwardRef(({ children, ...props }: any, ref: any) => {
                const domProps: Record<string, any> = { ref };
                for (const [key, val] of Object.entries(props)) {
                    if (!MOTION_PROP_NAMES.has(key)) {
                        domProps[key] = val;
                    }
                }
                return React.createElement(tag, domProps, children);
            });
            MotionComponent.displayName = `motion.${tag}`;
            return MotionComponent;
        },
    };

    const motionValue = (v: number) => ({
        get: vi.fn(() => v),
        set: vi.fn(),
        onChange: vi.fn(),
        on: vi.fn(),
    });

    return {
        motion: new Proxy({}, handler),
        AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
        useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
        useInView: () => true,
        useMotionValue: (v = 0) => motionValue(v),
        useSpring: (v = 0) => motionValue(typeof v === 'number' ? v : 0),
        useTransform: () => motionValue(0),
        useScroll: () => ({
            scrollX: motionValue(0),
            scrollY: motionValue(0),
            scrollXProgress: motionValue(0),
            scrollYProgress: motionValue(0),
        }),
        useMotionValueEvent: vi.fn(),
        useReducedMotion: () => false,
    };
});
