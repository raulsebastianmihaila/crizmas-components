// this is used as part of a 2d controller

(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let Mvc;
  let renderClip1DMixin;

  if (isModule) {
    Mvc = require('crizmas-mvc');
    renderClip1DMixin = require('./render-clip-1d-mixin');
  } else {
    ({Mvc, renderClip1DMixin} = window.crizmas);
  }

  const {getRenderClipControllerObject, getRenderClipMixStateObject,
    defineRenderClipControllerAccessors} = renderClip1DMixin;

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

    defineRenderClipControllerAccessors(ctrl, renderClipMixState);

    renderClipMixState.refreshWithCurrentRealScrollPosition =
      Mvc.observe(renderClipMix.refreshWithCurrentRealScrollPosition);

    ctrl.refresh = renderClipMixState.refreshWithCurrentRealScrollPosition;

    ctrl.onRender = Mvc.ignore(renderClipMix.onRender);

    renderClipMix.init({
      items,
      itemsCount,
      itemHeight,
      itemWidth
    });

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
