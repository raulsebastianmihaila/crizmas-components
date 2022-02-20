// the real clientHeight/Width is the same as the virtual clientHeight/Width
// the virtual values are view values. they are virtual because if the maximum allowed
// virtual total size is exceeded, then the virtual item is never displayed and because of this,
// the entire scrolling configuration is considered virtual.
// on the other hand, in this case, the scroll that the user sees is the virtual one, so the actual
// real scrolling is virtualized, while the user sees the real items.

import mixin from 'smart-mix';

const maxAllowedVirtualTotalItemsSize = 1e6;
const maxTranslatedVirtualizationScrollRecomputationDif = 1e2;
const smoothTranslatedVirtualizationScrollDif = 40;
const maxRelevantWheelUsageDif = 50;

const directions = {
  vertical: Symbol('vertical'),
  horizontal: Symbol('horizontal')
};

const getContext = (ctrl, mixState) => ({
  direction: null,
  renderedItemsStartIndex: 0,
  renderedItemsCount: 0,
  trimmedStartNegativeSize: 0,

  get items() {
    return mixState.items;
  },

  get isVertical() {
    return ctrl.direction === directions.vertical;
  },

  get clientSizeProp() {
    return ctrl.isVertical ? 'clientHeight' : 'clientWidth';
  },

  get scrollPositionProp() {
    return ctrl.isVertical ? 'scrollTop' : 'scrollLeft';
  },

  get orthogonalClientSizeProp() {
    return ctrl.isVertical ? 'clientWidth' : 'clientHeight';
  },

  get orthogonalScrollSizeProp() {
    return ctrl.isVertical ? 'scrollWidth' : 'scrollHeight';
  },

  get containerClientSize() {
    return mixState.domContainer[ctrl.clientSizeProp];
  },

  get containerScrollPosition() {
    // Safari can give out of bounds values for the scroll position
    return Math.min(
      Math.max(0, mixState.domContainer[ctrl.scrollPositionProp]),
      ctrl.virtualScrollSpace);
  },

  get containerOrthogonalClientSize() {
    return mixState.domContainer[ctrl.orthogonalClientSizeProp];
  },

  get containerOrthogonalScrollSize() {
    return mixState.domContainer[ctrl.orthogonalScrollSizeProp];
  },

  get virtualTotalItemsSize() {
    return Math.min(ctrl.realTotalItemsSize, maxAllowedVirtualTotalItemsSize);
  },

  get realVirtualScrollSpaceRatio() {
    return !ctrl.virtualScrollSpace && !ctrl.realScrollSpace
      ? 1
      : ctrl.realScrollSpace / ctrl.virtualScrollSpace;
  },

  get virtualScrollSpace() {
    return Math.max(0, ctrl.virtualTotalItemsSize - ctrl.containerClientSize);
  },

  get realScrollSpace() {
    return Math.max(0, ctrl.realTotalItemsSize - ctrl.containerClientSize);
  },

  get isScrollVirtualized() {
    return !!mixState.domContainer && ctrl.virtualTotalItemsSize > ctrl.containerClientSize * 3;
  },

  get isTranslatedVirtualization() {
    return ctrl.realVirtualScrollSpaceRatio > 1;
  },

  get isOrthogonalOverflow() {
    return ctrl.containerOrthogonalScrollSize > ctrl.containerOrthogonalClientSize;
  },

  get isVirtualizationEmptySpace() {
    return ctrl.isScrollVirtualized && ctrl.isEmptySpace;
  }
});

const getState = () => ({
  itemsCount: 0,
  items: null,
  domContainer: null,
  realScrollPosition: 0,
  setItemsCount: null,
  templateSetItemsCount: null,
  getRealItemPosition: null,
  updateNonVirtualized: null,
  templateUpdateNonVirtualized: null,
  updateRenderedItems: null,
  setPreservingRealScrollPosition: null
});

const renderClip1DMixin = mixin((ctrl, mixState) => {
  let realScrollPositionOnUnmount = 0;
  let mustResetScrollPositionAfterMount = false;
  let preserveRealScrollPosition = false;
  let lastPreserveRealScrollVirtualScrollPosition = null;
  let isVirtualScrollPositionSetProgramatically = false;
  let isSetItemsCountRerenderingCheckScheduled = false;
  let currentVirtualScrollPosition = 0;
  let lastOperationForSizeSync = null;
  let prevIsOrthogonalOverflow = false;
  let isWheelUsed = false;
  let lastWheelUsageTimestamp = -Infinity;
  const ctrlMix = {};

  ctrlMix.init = ({
    items,
    itemsCount = items ? items.length : 0,
    itemHeight
  }) => {
    checkItemsCountConsistency(items, itemsCount);

    mixState.itemsCount = itemsCount;
    mixState.items = items;
    mixState.templateUpdateNonVirtualized = templateUpdateNonVirtualized;
    mixState.templateSetItemsCount = templateSetItemsCount;
    mixState.setPreservingRealScrollPosition = setPreservingRealScrollPosition;

    ctrl.direction = itemHeight ? directions.vertical : directions.horizontal;
  };

  const checkItemsCountConsistency = (items, itemsCount) => {
    if (items && items.length !== itemsCount) {
      throw new Error('The passed itemsCount is not equal to the passed items.length.');
    }
  };

  ctrlMix.setDomContainer = (domContainer) => {
    const hadDomContainer = mixState.domContainer;

    if (!domContainer && hadDomContainer) {
      realScrollPositionOnUnmount = mixState.realScrollPosition;
    }

    mixState.domContainer = domContainer;

    ctrl.refresh();

    // updating the container scroll position can be done only after the items are rendered
    // at least once, otherwise the container will not have scroll space
    if (domContainer && !hadDomContainer) {
      mustResetScrollPositionAfterMount = true;
    }
  };

  ctrlMix.setItems = (items) => {
    mixState.items = items;

    ctrlMix.setItemsCount(mixState.items.length);
  };

  ctrlMix.setItemsCount = (itemsCount) => {
    // it's possible that the container size is set based on the number of rendered items
    // and when setting the items count, it's possible that the rendered items count was computed
    // based on the old container size and that now there is empty space but without virtualization
    isSetItemsCountRerenderingCheckScheduled = true;

    return mixState.setItemsCount(itemsCount);
  };

  const templateSetItemsCount = (itemsCount, {afterUpdatingItemsCountHook} = {}) => {
    checkItemsCountConsistency(mixState.items, itemsCount);

    mixState.itemsCount = itemsCount;

    if (afterUpdatingItemsCountHook) {
      afterUpdatingItemsCountHook();
    }

    ctrl.refresh();
  };

  ctrlMix.refreshWithCurrentRealScrollPosition = () => {
    // refreshing means updating the rendered items and the virtual scroll position
    // while trying to keep the current real scroll position

    preserveRealScrollPosition = true;

    if (!ctrl.isScrollVirtualized) {
      return void mixState.updateNonVirtualized();
    }

    // it's possible that the content changed and now there's less
    mixState.realScrollPosition = Math.min(mixState.realScrollPosition, ctrl.realScrollSpace);

    let virtualScrollPosition;

    // it's possible that truncating the virtual scroll position results in extra virtual content
    if (mixState.realScrollPosition === ctrl.realScrollSpace) {
      virtualScrollPosition = ctrl.virtualScrollSpace;
    } else {
      // the virtual scroll position is computed based on the real scroll position,
      // but it's possible that the translated real scroll position into the virtual one
      // is too great and it's important when comparing the result with the current
      // dom scroll position
      virtualScrollPosition = Math.min(
        Math.trunc(mixState.realScrollPosition / ctrl.realVirtualScrollSpaceRatio),
        ctrl.virtualScrollSpace);

      // when truncating the virtual scroll position it's possible that it becomes 0 even though
      // there is still some content before
      if (!virtualScrollPosition && mixState.realScrollPosition > 0) {
        virtualScrollPosition = 1;
      }
    }

    lastPreserveRealScrollVirtualScrollPosition = virtualScrollPosition;

    if (ctrl.containerScrollPosition !== virtualScrollPosition) {
      // the rendered items will be updated during the next scroll event handling as well
      isVirtualScrollPositionSetProgramatically = true;
      mixState.domContainer[ctrl.scrollPositionProp] = virtualScrollPosition;
    }

    // it's better to always update the items even if the scroll position changes
    // because if the items changed we don't want to wait for the scroll event
    mixState.updateRenderedItems();
  };

  const templateUpdateNonVirtualized = ({afterUpdatingRenderingInfoHook} = {}) => {
    ctrl.renderedItemsStartIndex = 0;
    ctrl.renderedItemsCount = mixState.domContainer ? mixState.itemsCount : 0;
    ctrl.trimmedStartNegativeSize = 0;

    if (afterUpdatingRenderingInfoHook) {
      afterUpdatingRenderingInfoHook();
    }

    if (mixState.domContainer) {
      currentVirtualScrollPosition = ctrl.containerScrollPosition;

      // the list may become non-virtualized without any scroll position change
      // by changing the content
      if (preserveRealScrollPosition
        && ctrl.containerScrollPosition !== mixState.realScrollPosition) {
        mixState.domContainer[ctrl.scrollPositionProp] = mixState.realScrollPosition;
      }

      mixState.realScrollPosition = ctrl.containerScrollPosition;
    } else {
      mixState.realScrollPosition = 0;
      currentVirtualScrollPosition = 0;
    }
  };

  const setPreservingRealScrollPosition = () => {
    mixState.realScrollPosition = preserveRealScrollPosition
      && lastPreserveRealScrollVirtualScrollPosition === ctrl.containerScrollPosition
        ? mixState.realScrollPosition
        : ctrl.containerScrollPosition * ctrl.realVirtualScrollSpaceRatio;
  };

  ctrlMix.onRender = ({afterSizeSyncChecksHook} = {}) => {
    if (!mixState.domContainer) {
      throw new Error('DOM container missing');
    }

    const operationForSizeSync = lastOperationForSizeSync
      || mixState.refreshWithCurrentRealScrollPosition;
    const syncResolutionDefaults = {
      mustReapplyLastOperationForSizeSync: false,
      lastOperationForSizeSync: operationForSizeSync
    };
    const wasSetItemsCountRerenderingCheckScheduled = isSetItemsCountRerenderingCheckScheduled;

    isSetItemsCountRerenderingCheckScheduled = false;

    if (mustResetScrollPositionAfterMount) {
      mustResetScrollPositionAfterMount = false;

      scrollToRealScrollPosition(realScrollPositionOnUnmount);

      return syncResolutionDefaults;
    }

    if (!isVirtualScrollPositionSetProgramatically) {
      const wasOrthogonalOverflow = prevIsOrthogonalOverflow;

      prevIsOrthogonalOverflow = ctrl.isOrthogonalOverflow;

      if (ctrl.isVirtualizationEmptySpace
        || !wasOrthogonalOverflow && prevIsOrthogonalOverflow
        || wasSetItemsCountRerenderingCheckScheduled && ctrl.isEmptySpace) {
        return {
          ...syncResolutionDefaults,
          mustReapplyLastOperationForSizeSync: true
        };
      }
    }

    if (afterSizeSyncChecksHook) {
      const hookResult = afterSizeSyncChecksHook(syncResolutionDefaults);

      if (hookResult) {
        return hookResult;
      }
    }

    if (!isVirtualScrollPositionSetProgramatically) {
      lastOperationForSizeSync = null;
      preserveRealScrollPosition = false;
    }

    return syncResolutionDefaults;
  };

  const scrollToRealScrollPosition = (realScrollPosition) => {
    lastOperationForSizeSync = scrollToRealScrollPosition.bind(null, realScrollPosition);

    refreshWithRealScrollPosition(realScrollPosition);
  };

  const refreshWithRealScrollPosition = (realScrollPosition_) => {
    mixState.realScrollPosition = Math.min(
      Math.max(0, realScrollPosition_),
      ctrl.realScrollSpace);

    mixState.refreshWithCurrentRealScrollPosition();
  };

  ctrlMix.onWheel = () => {
    if (ctrl.isTranslatedVirtualization) {
      isWheelUsed = true;
      lastWheelUsageTimestamp = performance.now();
    }
  };

  ctrlMix.onScroll = () => {
    const wasVirtualScrollPositionSetProgramatically = isVirtualScrollPositionSetProgramatically;
    let wasWheelUsed = false;

    if (isWheelUsed) {
      if (performance.now() - lastWheelUsageTimestamp > maxRelevantWheelUsageDif) {
        isWheelUsed = false;
      } else {
        wasWheelUsed = true;
      }
    }

    isVirtualScrollPositionSetProgramatically = false;

    if (!ctrl.isScrollVirtualized) {
      return void mixState.updateNonVirtualized();
    }

    let scrollDif = ctrl.containerScrollPosition - currentVirtualScrollPosition;

    currentVirtualScrollPosition = ctrl.containerScrollPosition;

    if (ctrl.isTranslatedVirtualization && !wasVirtualScrollPositionSetProgramatically) {
      let mustCorrectScroll = false;

      if (Math.abs(scrollDif) <= maxTranslatedVirtualizationScrollRecomputationDif) {
        mustCorrectScroll = true;
        scrollDif = Math.sign(scrollDif)
          * Math.max(Math.abs(scrollDif), smoothTranslatedVirtualizationScrollDif);
      } else if (wasWheelUsed) {
        mustCorrectScroll = true;
        scrollDif = Math.sign(scrollDif) * smoothTranslatedVirtualizationScrollDif;
      }

      if (mustCorrectScroll) {
        return void refreshWithRealScrollPosition(mixState.realScrollPosition + scrollDif);
      }
    }

    mixState.updateRenderedItems();
  };

  ctrlMix.scrollIntoView = (index, {ifNeeded, alignEnd, fit} = {}) => {
    if (!mixState.domContainer) {
      return;
    }

    lastOperationForSizeSync = ctrlMix.scrollIntoView.bind(
      null,
      index,
      {ifNeeded, alignEnd, fit});

    refreshWithRealScrollPosition(getStartScrollPositionForIndex(
      index,
      {ifNeeded, alignEnd, fit}));
  };

  const getStartScrollPositionForIndex = (index, {ifNeeded, alignEnd, fit} = {}) => {
    // fit means that if the desired scroll position is after the viewport, the result
    // will be aligned to the end and if it's before the viewport, the result
    // will be aligned to the start.

    index = Math.max(Math.min(index, mixState.itemsCount - 1), 0);

    const realIndexScrollPosition = mixState.getRealItemPosition(index);
    const realIndexEndAlignedScrollTop = Math.max(
      0,
      realIndexScrollPosition - ctrl.containerClientSize + ctrl.getRealItemSize(index));

    if (ifNeeded || fit) {
      if (realIndexScrollPosition >= mixState.realScrollPosition
        && mixState.realScrollPosition >= realIndexEndAlignedScrollTop) {
        return mixState.realScrollPosition;
      }

      if (fit && Math.abs(mixState.realScrollPosition - realIndexEndAlignedScrollTop)
        < Math.abs(mixState.realScrollPosition - realIndexScrollPosition)) {
        return realIndexEndAlignedScrollTop;
      }
    }

    if (alignEnd) {
      return realIndexEndAlignedScrollTop;
    }

    return realIndexScrollPosition;
  };

  ctrlMix.scrollToFit = (index) => ctrlMix.scrollIntoView(index, {fit: true});

  ctrlMix.scrollTo = (scrollPosition) => {
    if (!mixState.domContainer) {
      return;
    }

    lastOperationForSizeSync = ctrlMix.scrollTo.bind(null, scrollPosition);

    refreshWithRealScrollPosition(scrollPosition * ctrl.realVirtualScrollSpaceRatio);
  };

  return ctrlMix;
});

export default renderClip1DMixin;

renderClip1DMixin.getContext = getContext;
renderClip1DMixin.getState = getState;
