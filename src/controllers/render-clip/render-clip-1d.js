// this is used as part of a 2d controller

(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let Mvc;
  let getRenderClip1DDefinition;

  if (isModule) {
    Mvc = require('crizmas-mvc');
    getRenderClip1DDefinition = require('./render-clip-1d-definition');
  } else {
    ({Mvc, getRenderClip1DDefinition} = window.crizmas);
  }

  const RenderClip1D = Mvc.controller(function RenderClip1D({
    items,
    itemsCount,
    itemHeight,
    itemWidth
  } = {}) {
    const definition = getRenderClip1DDefinition({
      items,
      itemsCount,
      itemHeight,
      itemWidth
    });
    const {ctrl, ctrlMixState, ctrlMix} = definition;

    ctrl.refresh = ctrlMixState.refreshWithCurrentRealScrollPosition;

    ctrl.onRender = Mvc.ignore(ctrlMix.onRender);

    definition.init();

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
