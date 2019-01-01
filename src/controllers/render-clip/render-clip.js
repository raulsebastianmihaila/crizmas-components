// this is the render clip controller for one dimension alone (which is not
// part of a 2d controller)

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

  const RenderClip = Mvc.controller(function RenderClip({
    items,
    itemsCount,
    itemHeight,
    itemWidth
  } = {}) {
    let mustResetOrthogonalMinSize = false;
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

    ctrl.refresh = () => {
      mustResetOrthogonalMinSize = true;

      renderClipMixState.refreshWithCurrentRealScrollPosition();
    };

    ctrl.onRender = Mvc.ignore(() => renderClipMix.onRender({
      afterSizeSyncChecksHook: (syncResolutionDefaults) => {
        if (mustResetOrthogonalMinSize) {
          mustResetOrthogonalMinSize = false;

          return {
            ...syncResolutionDefaults,
            mustResetOrthogonalMinSize: true,
            mustReapplyLastOperationForSizeSyncIfChangesMade: true
          };
        }
      }
    }));

    renderClipMix.init({
      items,
      itemsCount,
      itemHeight,
      itemWidth
    });

    return ctrl;
  });

  const moduleExports = RenderClip;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.RenderClipController = moduleExports;
  }
})();
