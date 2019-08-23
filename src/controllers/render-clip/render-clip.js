// this is the render clip controller for one dimension alone (which is not
// part of a 2d controller)

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

  const RenderClip = Mvc.controller(function RenderClip({
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
    let mustResetOrthogonalMinSize = false;

    ctrl.refresh = () => {
      mustResetOrthogonalMinSize = true;

      ctrlMixState.refreshWithCurrentRealScrollPosition();
    };

    ctrl.onRender = Mvc.ignore(() => ctrlMix.onRender({
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

    definition.init();

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
