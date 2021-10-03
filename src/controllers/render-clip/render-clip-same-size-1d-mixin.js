import mixin from 'smart-mix';

const getExtraContext = (ctrl, mixState) => ({
  get realTotalItemsSize() {
    return mixState.itemsCount * mixState.realItemSize;
  },

  get isVirtualizationEmptySpace() {
    // comparison with 0.1 prevents weird floating point issues
    return ctrl.isScrollVirtualized
      && ctrl.containerClientSize
        - (ctrl.renderedItemsCount * mixState.realItemSize + ctrl.trimmedStartNegativeSize)
          > 0.1;
  }
});

const getExtraState = () => ({
  realItemSize: 0
});

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
    mixState.setItemsCount = mixState.templateSetItemsCount;
    mixState.getRealItemPosition = getRealItemPosition;
    mixState.updateNonVirtualized = mixState.templateUpdateNonVirtualized;
    mixState.updateRenderedItems = updateRenderedItems;
  };

  const getRealItemPosition = (index) => index * mixState.realItemSize;

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

renderClipSameSize1DMixin.getContext = getExtraContext;
renderClipSameSize1DMixin.getState = getExtraState;

export default renderClipSameSize1DMixin;
