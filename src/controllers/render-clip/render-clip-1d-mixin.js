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
    direction: null,
    renderedItemsStartIndex: 0,
    renderedItemsCount: 0,
    trimmedStartNegativeSize: 0
  });

  const getRenderClipMixStateObject = () => ({
    itemsCount: 0,
    items: null,
    domContainer: null,
    realScrollPosition: 0,
    lastOperationForSizeSync: null,
    prevIsOrthogonalOverflow: false,
    getRealItemPosition: null,
    updateRenderingInfoOnItemsCountChange: null,
    updateNonVirtualized: null,
    templateUpdateNonVirtualized: null,
    updateRenderedItems: null,
    setPreservingRealScrollPosition: null
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
      }
    }));

  const renderClip1DMixin = mixin((ctrl, mixState) => {
    let currentVirtualScrollPosition = 0;
    let preserveRealScrollPosition = false;
    let lastPreserveRealScrollVirtualScrollPosition = null;
    let isVirtualScrollPositionSetProgramatically = false;
    const ctrlMix = {};

    ctrlMix.init = ({
      items: items_,
      itemsCount: itemsCount_ = items_ ? items_.length : 0,
      itemHeight
    }) => {
      checkItemsCountConsistency(items_, itemsCount_);

      mixState.itemsCount = itemsCount_;
      mixState.items = items_;
      mixState.templateUpdateNonVirtualized = templateUpdateNonVirtualized;
      mixState.setPreservingRealScrollPosition = setPreservingRealScrollPosition;

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

      mixState.updateRenderingInfoOnItemsCountChange();
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
        virtualScrollPosition = ctrl.virtualMaxScrollPosition;
      } else {
        // the virtual scroll position is computed based on the real scroll position,
        // but it's possible that the translated real scroll position into the virtual one
        // is too great and it's important when comparing the result with the current
        // dom scroll position
        virtualScrollPosition = Math.min(
          Math.trunc(mixState.realScrollPosition / ctrl.realVirtualScrollSpaceRatio),
          ctrl.virtualMaxScrollPosition);

        // when truncating the virtual scroll position it's possible that it becomes 0 even though
        // there is still some content before
        if (!virtualScrollPosition && mixState.realScrollPosition > 0) {
          virtualScrollPosition = 1;
        }
      }

      lastPreserveRealScrollVirtualScrollPosition = virtualScrollPosition;

      if (ctrl.containerScrollPosition !== virtualScrollPosition) {
        // the rendered items will be updated during the next scroll event handling
        isVirtualScrollPositionSetProgramatically = true;
        mixState.domContainer[ctrl.scrollPositionProp] = virtualScrollPosition;
      } else {
        mixState.updateRenderedItems();
      }
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
        return void mixState.updateNonVirtualized();
      }

      let scrollDif = ctrl.containerScrollPosition - currentVirtualScrollPosition;

      currentVirtualScrollPosition = ctrl.containerScrollPosition;

      if (ctrl.isTranslatedVirtualization
        && !wasVirtualScrollPositionSetProgramatically
        && Math.abs(scrollDif) <= maxTranslatedVirtualizationScrollRecomputationDif) {
        scrollDif = Math.sign(scrollDif)
          * Math.max(Math.abs(scrollDif), smoothTranslatedVirtualizationScrollDif);

        return void refreshWithRealScrollPosition(mixState.realScrollPosition + scrollDif);
      }

      mixState.updateRenderedItems();
    };

    const refreshWithRealScrollPosition = (realScrollPosition_) => {
      mixState.realScrollPosition = Math.min(
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
