import {observe, ignore, isFunc} from 'crizmas-mvc';

import renderClip1DMixin from './render-clip-1d-mixin.js';
import renderClipSameSize1DMixin from './render-clip-same-size-1d-mixin.js';
import renderClipIndividualSize1DMixin from './render-clip-individual-size-1d-mixin.js';

export default ({
  items,
  itemsCount,
  itemHeight,
  itemWidth
}) => {
  const ctrlMixState = {};
  const ctrl = {};
  const ctrlMix = renderClip1DMixin({
    meta: true,
    context: ctrl,
    state: ctrlMixState,
    mixMethods: [
      'init',
      'refreshWithCurrentRealScrollPosition',
      'onRender'
    ],
    contextMethods: [
      'setDomContainer',
      'setItems',
      'setItemsCount',
      'onScroll',
      'scrollIntoView',
      'scrollToFit',
      'scrollTo'
    ]
  });
  const isSameItemSize = !isFunc(itemHeight) && !isFunc(itemWidth);
  const renderClipExtraMix = isSameItemSize
    ? renderClipSameSize1DMixin({
      meta: true,
      context: ctrl,
      state: ctrlMixState,
      mixMethods: [
        'init',
        'getRealItemSize'
      ]
    })
    : renderClipIndividualSize1DMixin({
      meta: true,
      context: ctrl,
      state: ctrlMixState,
      mixMethods: [
        'init',
        'getGetRealItemSizeDefinition'
      ],
      contextMethods: [
        'updateLayout'
      ]
    });

  const init = () => {
    ctrlMix.init({
      items,
      itemsCount,
      itemHeight
    });

    // we init from mix before so we know if it's vertical or horizontal
    // in getGetRealItemSizeDefinition
    ctrl.getRealItemSize = isSameItemSize
      ? ignore(renderClipExtraMix.getRealItemSize)
      : ignore(renderClipExtraMix.getGetRealItemSizeDefinition(itemHeight, itemWidth));

    renderClipExtraMix.init({
      itemHeight,
      itemWidth
    });
  };

  ctrlMixState.refreshWithCurrentRealScrollPosition =
    observe(ctrlMix.refreshWithCurrentRealScrollPosition);

  return {
    ctrl,
    ctrlMixState,
    ctrlMix,
    init
  };
};
