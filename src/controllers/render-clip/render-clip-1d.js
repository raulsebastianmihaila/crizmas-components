// this is used as part of a 2d controller

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
  const {getRenderClipControllerObject, getRenderClipMixStateObject,
    defineRenderClipControllerAccessors} = renderClip1DMixin;
  const {getRenderClipSameSizeMixStateExtraObject,
    defineRenderClipSameSizeControllerExtraAccessors} = renderClipSameSize1DMixin;
  const {getRenderClipIndividualSizeControllerExtraObject,
    getRenderClipIndividualSizeMixStateExtraObject,
    defineRenderClipIndividualSizeControllerExtraAccessors} = renderClipIndividualSize1DMixin;

  const RenderClip1D = Mvc.controller(function RenderClip1D({
    items,
    itemsCount,
    itemHeight,
    itemWidth
  } = {}) {
    const renderClipMixState = getRenderClipMixStateObject();
    const ctrl = getRenderClipControllerObject();
    const renderClipMix = renderClip1DMixin({
      context: ctrl,
      state: renderClipMixState,
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
        context: ctrl,
        state: renderClipMixState,
        mixMethods: [
          'init',
          'getRealItemSize'
        ]
      })
      : renderClipIndividualSize1DMixin({
        context: ctrl,
        state: renderClipMixState,
        mixMethods: [
          'init',
          'getGetRealItemSizeDefinition'
        ]
      });

    const define = () => {
      defineRenderClipControllerAccessors(ctrl, renderClipMixState);

      if (isSameItemSize) {
        Object.assign(renderClipMixState, getRenderClipSameSizeMixStateExtraObject());
        defineRenderClipSameSizeControllerExtraAccessors(ctrl, renderClipMixState);
      } else {
        Object.assign(ctrl, getRenderClipIndividualSizeControllerExtraObject());
        Object.assign(renderClipMixState, getRenderClipIndividualSizeMixStateExtraObject());
        defineRenderClipIndividualSizeControllerExtraAccessors(ctrl, renderClipMixState);
      }
    };

    const init = () => {
      renderClipMix.init({
        items,
        itemsCount,
        itemHeight
      });

      // we init from mix before so we know if it's vertical or horizontal
      ctrl.getRealItemSize = isSameItemSize
        ? Mvc.ignore(renderClipExtraMix.getRealItemSize)
        : Mvc.ignore(renderClipExtraMix.getGetRealItemSizeDefinition(itemHeight, itemWidth));

      renderClipExtraMix.init({
        itemHeight,
        itemWidth
      });
    };

    renderClipMixState.refreshWithCurrentRealScrollPosition =
      Mvc.observe(renderClipMix.refreshWithCurrentRealScrollPosition);

    ctrl.refresh = renderClipMixState.refreshWithCurrentRealScrollPosition;

    ctrl.onRender = Mvc.ignore(renderClipMix.onRender);

    define();
    init();

    return ctrl;
  });

  const moduleExports = RenderClip1D;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.RenderClip1DController = moduleExports;
  }
})();
