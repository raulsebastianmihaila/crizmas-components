(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let Mvc;
  let utils;
  let renderClip1DMixin;
  let renderClipSameSize1DMixin;
  let renderClipIndividualSize1DMixin;

  if (isModule) {
    Mvc = require('crizmas-mvc');
    utils = require('crizmas-utils');
    renderClip1DMixin = require('./render-clip-1d-mixin');
    renderClipSameSize1DMixin = require('./render-clip-same-size-1d-mixin.js');
    renderClipIndividualSize1DMixin = require('./render-clip-individual-size-1d-mixin.js');
  } else {
    ({Mvc, utils, renderClip1DMixin, renderClipSameSize1DMixin,
      renderClipIndividualSize1DMixin} = window.crizmas);
  }

  const {isFunc} = utils;

  const getRenderClip1DDefinition = ({
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
        ? Mvc.ignore(renderClipExtraMix.getRealItemSize)
        : Mvc.ignore(renderClipExtraMix.getGetRealItemSizeDefinition(itemHeight, itemWidth));

      renderClipExtraMix.init({
        itemHeight,
        itemWidth
      });
    };

    ctrlMixState.refreshWithCurrentRealScrollPosition =
      Mvc.observe(ctrlMix.refreshWithCurrentRealScrollPosition);

    return {
      ctrl,
      ctrlMixState,
      ctrlMix,
      init
    };
  };

  const moduleExports = getRenderClip1DDefinition;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.getRenderClip1DDefinition = moduleExports;
  }
})();
