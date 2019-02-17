(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let mixin;

  if (isModule) {
    mixin = require('smart-mix');
  } else {
    ({mixin} = window);
  }

  const getRenderClipSameSizeMixStateExtraObject = () => ({
    realItemSize: 0
  });

  const defineRenderClipSameSizeControllerExtraAccessors = (ctrl, mixState) =>
    Object.defineProperties(ctrl, Object.getOwnPropertyDescriptors({
      get realTotalItemsSize() {
        return mixState.itemsCount * mixState.realItemSize;
      },

      get isVirtualizationEmptySpace() {
        return ctrl.isScrollVirtualized
          && ctrl.renderedItemsCount * mixState.realItemSize + ctrl.trimmedStartNegativeSize
            < ctrl.containerClientSize;
      }
    }));

  const renderClipSameSize1DMixin = mixin((ctrl, mixState) => {
    const ctrlMix = {};

    ctrlMix.getRealItemSize = () => mixState.realItemSize;

    ctrlMix.init = ({
      itemHeight,
      itemWidth
    }) => {
      if (!itemHeight && !itemWidth) {
        throw new Error('Either itemHeight or itemWidth must be provided.');
      }

      mixState.realItemSize = itemHeight || itemWidth;
      mixState.getRealItemPosition = getRealItemPosition;
      mixState.updateRenderingInfoOnItemsCountChange = updateRenderingInfoOnItemsCountChange;
      mixState.updateNonVirtualized = mixState.templateUpdateNonVirtualized;
      mixState.updateRenderedItems = updateRenderedItems;
    };

    const getRealItemPosition = (index) => index * mixState.realItemSize;

    const updateRenderingInfoOnItemsCountChange = () => {
      const renderedItemsEndDif = ctrl.renderedItemsStartIndex + ctrl.renderedItemsCount
        - mixState.itemsCount;

      if (renderedItemsEndDif > 0) {
        ctrl.renderedItemsCount = Math.min(ctrl.renderedItemsCount, mixState.itemsCount);
        ctrl.renderedItemsStartIndex = mixState.itemsCount - ctrl.renderedItemsCount;
      }
    };

    const updateRenderedItems = () => {
      mixState.setPreservingRealScrollPosition();

      const realBeforeViewportWholeItemsCount =
        getWholeRealItemsCountInSpace(mixState.realScrollPosition);
      const realAfterViewportWholeItemsCount = getWholeRealItemsCountInSpace(
        ctrl.realTotalItemsSize - mixState.realScrollPosition - ctrl.containerClientSize);
      // can include partially visible items
      const realViewportItemsCount = mixState.itemsCount - realBeforeViewportWholeItemsCount
        - realAfterViewportWholeItemsCount;
      const realBeforeViewportWholeItemsSize = realBeforeViewportWholeItemsCount
        * mixState.realItemSize;
      const realStartTrimmedSize = mixState.realScrollPosition - realBeforeViewportWholeItemsSize;

      ctrl.renderedItemsStartIndex = realBeforeViewportWholeItemsCount;
      ctrl.renderedItemsCount = realViewportItemsCount;
      ctrl.trimmedStartNegativeSize = -realStartTrimmedSize;
    };

    const getWholeRealItemsCountInSpace = (space) => {
      return Math.trunc(space / mixState.realItemSize);
    };

    return ctrlMix;
  });

  renderClipSameSize1DMixin.getRenderClipSameSizeMixStateExtraObject =
    getRenderClipSameSizeMixStateExtraObject;
  renderClipSameSize1DMixin.defineRenderClipSameSizeControllerExtraAccessors =
    defineRenderClipSameSizeControllerExtraAccessors;

  const moduleExports = renderClipSameSize1DMixin;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.renderClipSameSize1DMixin = moduleExports;
  }
})();
