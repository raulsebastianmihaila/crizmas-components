// this is used as part of a 2d controller

import {controller, ignore} from 'crizmas-mvc';

import getRenderClip1DDefinition from './render-clip-1d-definition.js';

export default controller(function RenderClip1DController({
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

  ctrl.onRender = ignore(ctrlMix.onRender);

  definition.init();

  return ctrl;
});
