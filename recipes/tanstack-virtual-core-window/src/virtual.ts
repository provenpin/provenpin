import { Virtualizer, defaultRangeExtractor } from "@tanstack/virtual-core";

type FakeEl = {
  clientWidth: number;
  clientHeight: number;
  scrollTop: number;
  scrollLeft: number;
};

export function createListVirtualizer(count: number, estimateSize = 40, height = 200) {
  const el: FakeEl = {
    clientWidth: 320,
    clientHeight: height,
    scrollTop: 0,
    scrollLeft: 0,
  };

  const virtualizer = new Virtualizer<Element, Element>({
    count,
    // Offline stand-in for a DOM element, cast only for the type. virtual-core 3.19.5 itself only checks
    // "ownerDocument" in it (absent, so no window, ResizeObserver or rAF); sizes come from the callbacks below.
    getScrollElement: () => el as unknown as Element,
    estimateSize: () => estimateSize,
    scrollToFn: () => {},
    observeElementRect: (_instance, cb) => {
      cb({ width: el.clientWidth, height: el.clientHeight });
    },
    observeElementOffset: (_instance, cb) => {
      cb(0, false);
    },
    overscan: 2,
    initialRect: { width: 320, height },
    initialOffset: 0,
  });

  virtualizer._didMount();
  virtualizer._willUpdate();
  return virtualizer;
}

export function visibleIndexes(v: Virtualizer<Element, Element>) {
  return v.getVirtualItems().map((i) => i.index);
}

export { defaultRangeExtractor };
