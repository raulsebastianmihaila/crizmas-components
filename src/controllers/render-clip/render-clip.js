// this is the render clip controller for one dimension alone (which is not
// part of a 2d controller)

import {controller, ignore} from 'crizmas-mvc';

import getRenderClip1DDefinition from './render-clip-1d-definition.js';

export default controller(function RenderClipController({
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

  ctrl.onRender = ignore(() => ctrlMix.onRender({
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
