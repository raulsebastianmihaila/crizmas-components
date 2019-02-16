(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let mixin;

  if (isModule) {
    mixin = require('smart-mix');
  } else {
    ({mixin} = window);
  }

  const getRenderClipIndividualSizeControllerExtraObject = () => ({
    realTotalItemsSize: 0
  });

  const getRenderClipIndividualSizeMixStateExtraObject = () => ({
    totalRenderedItemsSize: 0
  });

  const defineRenderClipIndividualSizeControllerExtraAccessors = (ctrl, mixState) =>
    Object.defineProperties(ctrl, Object.getOwnPropertyDescriptors({
      get isVirtualizationEmptySpace() {
        return ctrl.isScrollVirtualized
          && mixState.totalRenderedItemsSize + ctrl.trimmedStartNegativeSize
            < ctrl.containerClientSize;
      }
    }));

  const renderClipIndividualSize1DMixin = mixin((ctrl, mixState) => {
    let itemsPositions = null;
    const ctrlMix = {};

    ctrlMix.init = ({
      itemHeight,
      itemWidth
    }) => {
      if (!itemHeight && !itemWidth) {
        throw new Error('Either itemHeight or itemWidth must be provided.');
      }

      mixState.getRealItemPosition = getRealItemPosition;
      mixState.updateRenderingInfoOnItemsCountChange = updateRenderingInfoOnItemsCountChange;
      mixState.updateNonVirtualized = updateNonVirtualized;
      mixState.updateRenderedItems = updateRenderedItems;

      setRealTotalItemsSize();
    };

    ctrlMix.getGetRealItemSizeDefinition = (itemHeight, itemWidth) => ctrl.isVertical
      ? (index) => itemHeight(index, mixState.items && mixState.items[index])
      : (index) => itemWidth(index, mixState.items && mixState.items[index]);

    const getRealItemPosition = (index) => itemsPositions[index];

    const setRealTotalItemsSize = () => {
      itemsPositions = Array(mixState.itemsCount + 1);
      ctrl.realTotalItemsSize = getRealTotalItemsSizeAndPositions();
    };

    const getRealTotalItemsSizeAndPositions = () => {
      let space = 0;
      let {itemsCount} = mixState;

      for (let i = 0; i < itemsCount; i += 1) {
        itemsPositions[i] = space;
        space += ctrl.getRealItemSize(i);
      }

      itemsPositions[itemsCount] = space;

      return space;
    };

    const updateRenderingInfoOnItemsCountChange = () => {
      setRealTotalItemsSize();

      // since we don't know at this point what is going to be visible, because
      // the items can have different sizes, we need to refresh and because we don't know
      // whether there will be an intermediate rendering (because of potentially updating
      // the scroll position when refreshing) we must reset the rendered items info.
      ctrl.renderedItemsCount = 0;
      ctrl.renderedItemsStartIndex = 0;
      mixState.totalRenderedItemsSize = 0;
    };

    const updateNonVirtualized = () => mixState.templateUpdateNonVirtualized({
      afterUpdatingRenderingInfoHook: () => {
        mixState.totalRenderedItemsSize = mixState.domContainer ? ctrl.realTotalItemsSize : 0;
      }
    });

    const updateRenderedItems = () => {
      mixState.setPreservingRealScrollPosition();

      const {
        lastItemIndexInSpace: firstRenderedItemIndex,
        lastItemIndexInSpacePosition: renderedItemsSpaceStart
      } = getLastItemInSpaceInfo(mixState.realScrollPosition);
      const {
        spaceEndFromLastIndexBeforePosition: renderedItemsSpaceEnd,
        fromPositionClosestIndex: renderedItemsFromEndClosestIndex
      } = getLastItemInSpaceInfo(mixState.realScrollPosition + ctrl.containerClientSize);
      const realStartTrimmedSize = mixState.realScrollPosition - renderedItemsSpaceStart;

      ctrl.renderedItemsStartIndex = firstRenderedItemIndex;
      // can include partially visible items
      ctrl.renderedItemsCount = renderedItemsFromEndClosestIndex - firstRenderedItemIndex;
      ctrl.trimmedStartNegativeSize = -realStartTrimmedSize;
      mixState.totalRenderedItemsSize = renderedItemsSpaceEnd - renderedItemsSpaceStart;
    };

    const getLastItemInSpaceInfo = (position) => {
      // due to the number type it's possible that the calculated position exceeds the limit
      position = Math.min(position, mixState.getRealItemPosition(mixState.itemsCount));

      let lastItemIndexInSpace;

      if (itemsPositions[0] === position) {
        lastItemIndexInSpace = 0;
      } else {
        const lastIndex = mixState.itemsCount;

        if (itemsPositions[lastIndex] === position) {
          lastItemIndexInSpace = lastIndex;
        } else {
          lastItemIndexInSpace = searchClosestFromBeforeIndex(position, 0, lastIndex);
        }
      }

      const lastItemIndexInSpacePosition = itemsPositions[lastItemIndexInSpace];
      const positionReached = lastItemIndexInSpacePosition === position;
      const fromPositionClosestIndex = positionReached
        ? lastItemIndexInSpace
        : lastItemIndexInSpace + 1;
      const spaceEndFromLastIndexBeforePosition = positionReached
        ? lastItemIndexInSpacePosition
        : lastItemIndexInSpacePosition + ctrl.getRealItemSize(lastItemIndexInSpace);

      return {
        lastItemIndexInSpace,
        lastItemIndexInSpacePosition,
        fromPositionClosestIndex,
        spaceEndFromLastIndexBeforePosition
      };
    };

    const searchClosestFromBeforeIndex = (position, fromIndex, lastIndex) => {
      if (lastIndex - fromIndex === 1) {
        const lastIndexPosition = itemsPositions[lastIndex];

        if (lastIndexPosition < position) {
          return lastIndex;
        }

        return fromIndex;
      }

      const midIndex = Math.floor((fromIndex + lastIndex) / 2);
      const midIndexPosition = itemsPositions[midIndex];

      if (midIndexPosition === position) {
        return midIndex;
      }

      if (midIndexPosition < position) {
        return searchClosestFromBeforeIndex(position, midIndex, lastIndex);
      }

      return searchClosestFromBeforeIndex(position, fromIndex, midIndex);
    };

    return ctrlMix;
  });

  renderClipIndividualSize1DMixin.getRenderClipIndividualSizeControllerExtraObject =
    getRenderClipIndividualSizeControllerExtraObject;
  renderClipIndividualSize1DMixin.getRenderClipIndividualSizeMixStateExtraObject =
    getRenderClipIndividualSizeMixStateExtraObject;
  renderClipIndividualSize1DMixin.defineRenderClipIndividualSizeControllerExtraAccessors =
    defineRenderClipIndividualSizeControllerExtraAccessors;

  const moduleExports = renderClipIndividualSize1DMixin;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.renderClipIndividualSize1DMixin = moduleExports;
  }
})();