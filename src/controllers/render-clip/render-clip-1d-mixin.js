// the real clientHeight/Width is the same as the virtual clientHeight/Width
// the virtual values are view values. they are virtual because if the maximum allowed
// virtual total size is exceeded, then the virtual item is never displayed and because of this,
// the entire scrolling configuration is considered virtual.
// on the other hand, in this case, the scroll that the user sees is the virtual one, so the actual
// real scrolling is virtualized, while the user sees the real items.

(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let mixin;

  if (isModule) {
    mixin = require('smart-mix');
  } else {
    ({mixin} = window);
  }

  const maxAllowedVirtualTotalItemsSize = 1e6;
  const maxTranslatedVirtualizationScrollRecomputationDif = 1e2;
  const smoothTranslatedVirtualizationScrollDif = 40;

  const directions = {
    vertical: Symbol('vertical'),
    horizontal: Symbol('horizontal')
  };

  const getRenderClipControllerObject = () => ({
    realItemSize: 0,
    direction: null,
    renderedItemsStartIndex: 0,
    renderedItemsCount: 0,
    trimmedStartNegativeSize: 0
  });

  const getRenderClipMixStateObject = () => ({
    itemsCount: 0,
    items: null,
    domContainer: null,
    lastOperationForSizeSync: null,
    prevIsOrthogonalOverflow: false,
    refreshWithCurrentRealScrollPosition: null
  });

  const defineRenderClipControllerAccessors = (ctrl, mixState) =>
    Object.defineProperties(ctrl, Object.getOwnPropertyDescriptors({
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
        return mixState.domContainer[ctrl.scrollPositionProp];
      },

      get containerOrthogonalClientSize() {
        return mixState.domContainer[ctrl.orthogonalClientSizeProp];
      },

      get containerOrthogonalScrollSize() {
        return mixState.domContainer[ctrl.orthogonalScrollSizeProp];
      },

      get realTotalItemsSize() {
        return mixState.itemsCount * ctrl.realItemSize;
      },

      get virtualTotalItemsSize() {
        return Math.min(ctrl.realTotalItemsSize, maxAllowedVirtualTotalItemsSize);
      },

      get realVirtualScrollSpaceRatio() {
        const virtualScrollSpace = ctrl.virtualTotalItemsSize - ctrl.containerClientSize;

        return ctrl.realScrollSpace / virtualScrollSpace;
      },

      get isScrollVirtualized() {
        return !!mixState.domContainer && ctrl.virtualTotalItemsSize > ctrl.containerClientSize * 3;
      },

      get virtualMaxScrollPosition() {
        return ctrl.virtualTotalItemsSize - ctrl.containerClientSize;
      },

      get realScrollSpace() {
        return ctrl.realTotalItemsSize - ctrl.containerClientSize;
      },

      get isTranslatedVirtualization() {
        return ctrl.realVirtualScrollSpaceRatio > 1;
      },

      get isOrthogonalOverflow() {
        return ctrl.containerOrthogonalScrollSize > ctrl.containerOrthogonalClientSize;
      },

      get isVirtualizationEmptySpace() {
        return ctrl.isScrollVirtualized
          && ctrl.renderedItemsCount * ctrl.realItemSize + ctrl.trimmedStartNegativeSize
            < ctrl.containerClientSize;
      }
    }));

  const renderClip1DMixin = mixin((ctrl, mixState) => {
    let realScrollPosition = 0;
    let currentVirtualScrollPosition = 0;
    let preserveRealScrollPosition = false;
    let lastPreserveRealScrollVirtualScrollPosition = null;
    let isVirtualScrollPositionSetProgramatically = false;
    const ctrlMix = {};

    ctrlMix.init = ({
      items: items_,
      itemsCount: itemsCount_ = items_ ? items_.length : 0,
      itemHeight,
      itemWidth
    }) => {
      if (!itemHeight && !itemWidth) {
        throw new Error('Either itemHeight or itemWidth must be specified.');
      }

      checkItemsCountConsistency(items_, itemsCount_);

      mixState.itemsCount = itemsCount_;
      mixState.items = items_;

      ctrl.realItemSize = itemHeight || itemWidth;
      ctrl.direction = itemHeight ? directions.vertical : directions.horizontal;
    };

    const checkItemsCountConsistency = (items, itemsCount) => {
      if (items && items.length !== itemsCount) {
        throw new Error('The passed itemsCount is not equal to the passed items.length.');
      }
    };

    ctrlMix.setDomContainer = (domContainer_) => {
      mixState.domContainer = domContainer_;

      ctrl.refresh();
    };

    ctrlMix.setItems = (items_) => {
      mixState.items = items_;

      ctrlMix.setItemsCount(mixState.items.length);
    };

    ctrlMix.setItemsCount = (itemsCount_) => {
      checkItemsCountConsistency(mixState.items, itemsCount_);

      mixState.itemsCount = itemsCount_;

      const renderedItemsEndDif = ctrl.renderedItemsStartIndex + ctrl.renderedItemsCount
        - mixState.itemsCount;

      if (renderedItemsEndDif > 0) {
        ctrl.renderedItemsCount = Math.min(ctrl.renderedItemsCount, mixState.itemsCount);
        ctrl.renderedItemsStartIndex = mixState.itemsCount - ctrl.renderedItemsCount;
      }

      ctrl.refresh();
    };

    ctrlMix.refreshWithCurrentRealScrollPosition = () => {
      // refreshing means updating the rendered items and the virtual scroll position
      // while trying to keep the current real scroll position

      preserveRealScrollPosition = true;

      if (!ctrl.isScrollVirtualized) {
        return void updateNonVirtualized();
      }

      // it's possible that the content changed and now there's less
      realScrollPosition = Math.min(realScrollPosition, ctrl.realScrollSpace);

      let virtualScrollPosition;

      // it's possible that truncating the virtual scroll position results in extra virtual content
      if (realScrollPosition === ctrl.realScrollSpace) {
        virtualScrollPosition = ctrl.virtualMaxScrollPosition;
      } else {
        // the virtual scroll position is computed based on the real scroll position,
        // but it's possible that the translated real scroll position into the virtual one
        // is too great and it's important when comparing the result with the current
        // dom scroll position
        virtualScrollPosition = Math.min(
          Math.trunc(realScrollPosition / ctrl.realVirtualScrollSpaceRatio),
          ctrl.virtualMaxScrollPosition);

        // when truncating the virtual scroll position it's possible that it becomes 0 even though
        // there is still some content before
        if (!virtualScrollPosition && realScrollPosition > 0) {
          virtualScrollPosition = 1;
        }
      }

      lastPreserveRealScrollVirtualScrollPosition = virtualScrollPosition;

      if (ctrl.containerScrollPosition !== virtualScrollPosition) {
        // the rendered items will be updated during the next scroll event handling
        isVirtualScrollPositionSetProgramatically = true;
        mixState.domContainer[ctrl.scrollPositionProp] = virtualScrollPosition;
      } else {
        updateRenderedItems();
      }
    };

    const updateNonVirtualized = () => {
      ctrl.renderedItemsStartIndex = 0;
      ctrl.renderedItemsCount = mixState.domContainer ? mixState.itemsCount : 0;
      ctrl.trimmedStartNegativeSize = 0;

      if (mixState.domContainer) {
        currentVirtualScrollPosition = ctrl.containerScrollPosition;

        // the list may become non-virtualized without any scroll position change
        // by changing the content
        if (preserveRealScrollPosition) {
          if (ctrl.containerScrollPosition !== realScrollPosition) {
            isVirtualScrollPositionSetProgramatically = true;
            mixState.domContainer[ctrl.scrollPositionProp] = realScrollPosition;
          }
        } else {
          realScrollPosition = ctrl.containerScrollPosition;
        }
      } else {
        realScrollPosition = 0;
        currentVirtualScrollPosition = 0;
      }
    };

    const updateRenderedItems = () => {
      realScrollPosition = preserveRealScrollPosition
        && lastPreserveRealScrollVirtualScrollPosition === ctrl.containerScrollPosition
          ? realScrollPosition
          : ctrl.containerScrollPosition * ctrl.realVirtualScrollSpaceRatio;

      const realBeforeViewportWholeItemsCount = getWholeRealItemsCountInSpace(realScrollPosition);
      const realAfterViewportWholeItemsCount = getWholeRealItemsCountInSpace(
        ctrl.realTotalItemsSize - realScrollPosition - ctrl.containerClientSize);
      // can include partially visible items
      const realViewportItemsCount = mixState.itemsCount - realBeforeViewportWholeItemsCount
        - realAfterViewportWholeItemsCount;
      const realBeforeViewportWholeItemsSize = realBeforeViewportWholeItemsCount
        * ctrl.realItemSize;
      const realStartTrimmedSize = realScrollPosition - realBeforeViewportWholeItemsSize;

      ctrl.renderedItemsStartIndex = realBeforeViewportWholeItemsCount;
      ctrl.renderedItemsCount = realViewportItemsCount;
      ctrl.trimmedStartNegativeSize = -realStartTrimmedSize;
    };

    const getWholeRealItemsCountInSpace = (space) => {
      return Math.floor(space / ctrl.realItemSize);
    };

    ctrlMix.onRender = ({afterSizeSyncChecksHook} = {}) => {
      if (!mixState.domContainer) {
        throw new Error('DOM container missing');
      }

      const operationForSizeSync = mixState.lastOperationForSizeSync
        || mixState.refreshWithCurrentRealScrollPosition;
      const syncResolutionDefaults = {
        mustReapplyLastOperationForSizeSync: false,
        lastOperationForSizeSync: operationForSizeSync
      };

      if (!isVirtualScrollPositionSetProgramatically) {
        const wasOrhotogonalOverflow = mixState.prevIsOrthogonalOverflow;

        mixState.prevIsOrthogonalOverflow = ctrl.isOrthogonalOverflow;

        if (ctrl.isVirtualizationEmptySpace
          || !wasOrhotogonalOverflow && mixState.prevIsOrthogonalOverflow) {
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
        mixState.lastOperationForSizeSync = null;
        preserveRealScrollPosition = false;
      }

      return syncResolutionDefaults;
    };

    ctrlMix.onScroll = () => {
      const wasVirtualScrollPositionSetProgramatically = isVirtualScrollPositionSetProgramatically;

      isVirtualScrollPositionSetProgramatically = false;

      if (!ctrl.isScrollVirtualized) {
        return void updateNonVirtualized();
      }

      let scrollDif = ctrl.containerScrollPosition - currentVirtualScrollPosition;

      currentVirtualScrollPosition = ctrl.containerScrollPosition;

      if (ctrl.isTranslatedVirtualization
        && !wasVirtualScrollPositionSetProgramatically
        && Math.abs(scrollDif) <= maxTranslatedVirtualizationScrollRecomputationDif) {
        scrollDif = Math.sign(scrollDif)
          * Math.max(Math.abs(scrollDif), smoothTranslatedVirtualizationScrollDif);

        return void refreshWithRealScrollPosition(realScrollPosition + scrollDif);
      }

      updateRenderedItems();
    };

    const refreshWithRealScrollPosition = (realScrollPosition_) => {
      realScrollPosition = Math.min(
        Math.max(0, realScrollPosition_),
        ctrl.realScrollSpace);

      mixState.refreshWithCurrentRealScrollPosition();
    };

    ctrlMix.scrollIntoView = (index, {ifNeeded, alignEnd, fit} = {}) => {
      if (!mixState.domContainer) {
        return;
      }

      mixState.lastOperationForSizeSync = ctrlMix.scrollIntoView.bind(
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

      let realIndexScrollPosition = index * ctrl.realItemSize;
      const realIndexEndAlignedScrollTop = getRealEndAlignedScrollPosition(realIndexScrollPosition);

      if (ifNeeded || fit) {
        if (realIndexScrollPosition >= realScrollPosition
          && realScrollPosition >= realIndexEndAlignedScrollTop) {
          return realScrollPosition;
        }

        if (fit && Math.abs(realScrollPosition - realIndexEndAlignedScrollTop)
          < Math.abs(realScrollPosition - realIndexScrollPosition)) {
          return realIndexEndAlignedScrollTop;
        }
      }

      if (alignEnd) {
        return realIndexEndAlignedScrollTop;
      }

      return realIndexScrollPosition;
    };

    const getRealEndAlignedScrollPosition = (realScrollPosition) =>
      realScrollPosition - ctrl.containerClientSize + ctrl.realItemSize;

    ctrlMix.scrollToFit = (index) => ctrlMix.scrollIntoView(index, {fit: true});

    ctrlMix.scrollTo = (scrollPosition) => {
      if (!mixState.domContainer) {
        return;
      }

      mixState.lastOperationForSizeSync = mixState.refreshWithCurrentRealScrollPosition;

      refreshWithRealScrollPosition(scrollPosition * ctrl.realVirtualScrollSpaceRatio);
    };

    return ctrlMix;
  });

  renderClip1DMixin.getRenderClipControllerObject = getRenderClipControllerObject;
  renderClip1DMixin.getRenderClipMixStateObject = getRenderClipMixStateObject;
  renderClip1DMixin.defineRenderClipControllerAccessors = defineRenderClipControllerAccessors;

  const moduleExports = renderClip1DMixin;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.renderClip1DMixin = moduleExports;
  }
})();
