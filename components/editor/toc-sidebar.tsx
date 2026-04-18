'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  TableOfContentData,
  TableOfContentDataItem,
} from '@tiptap/extension-table-of-contents';

type TocContextValue = {
  tocContent: TableOfContentData | null;
  setTocContent: (value: TableOfContentData | null) => void;
  activeItem: TableOfContentDataItem | null;
  setActiveItem: (item: TableOfContentDataItem | null) => void;
};

const TocContext = createContext<TocContextValue>({
  tocContent: null,
  setTocContent: () => {},
  activeItem: null,
  setActiveItem: () => {},
});

export function TocProvider({ children }: { children: React.ReactNode }) {
  const [tocContent, setTocContent] = useState<TableOfContentData | null>(null);
  const [activeItem, setActiveItem] = useState<TableOfContentDataItem | null>(
    null
  );

  const value = useMemo(
    () => ({ tocContent, setTocContent, activeItem, setActiveItem }),
    [tocContent, activeItem]
  );

  return <TocContext.Provider value={value}>{children}</TocContext.Provider>;
}

export function useToc() {
  return useContext(TocContext);
}

function normalizeHeadingDepths(items: TableOfContentDataItem[]): number[] {
  if (items.length === 0) return [];

  const minLevel = Math.min(...items.map((i) => i.level));
  const depths: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const normalizedLevel = items[i].level - minLevel + 1;
    let depth = 1;
    for (let j = i - 1; j >= 0; j--) {
      if (items[j].level < items[i].level) {
        depth = depths[j] + 1;
        break;
      }
    }
    if (normalizedLevel <= depth) {
      depth = normalizedLevel;
    }
    depths.push(depth);
  }

  return depths;
}

export function TocSidebar({
  maxShowCount = 20,
  topOffset = 80,
  className = '',
}: {
  maxShowCount?: number;
  topOffset?: number;
  className?: string;
}) {
  const { tocContent, activeItem, setActiveItem } = useToc();
  const clickLockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined!);

  if (!tocContent || tocContent.length === 0) return null;

  const items = tocContent.slice(0, maxShowCount);
  const depths = normalizeHeadingDepths(items);

  const handleClick = (item: TableOfContentDataItem) => {
    setActiveItem(item);
    clickLockRef.current = true;
    clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      clickLockRef.current = false;
    }, 1500);

    const el = document.getElementById(item.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className={`toc-sidebar ${className}`}>
      <div className="toc-sidebar-wrapper">
        <div className="toc-sidebar-progress">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`toc-sidebar-progress-line${
                activeItem?.id === item.id || item.isScrolledOver
                  ? ' toc-sidebar-progress-line--active'
                  : ''
              }`}
            />
          ))}
        </div>
        <div className="toc-sidebar-nav">
          <p className="toc-sidebar-title">Table of Contents</p>
          {items.map((item, i) => {
            const isActive = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                className={`toc-sidebar-item${isActive ? ' toc-sidebar-item--active' : ''}`}
                style={{ paddingLeft: `${(depths[i] - 1) * 12 + 8}px` }}
              >
                {item.textContent}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
