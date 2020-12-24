import {controller} from 'crizmas-mvc';

import RenderClip1DController from './render-clip-1d.js';

export default controller(function RenderClip2DController({
  verticalItemsCount = 0,
  horizontalItemsCount = 0,
  itemHeight,
  itemWidth
} = {}) {
  const ctrl = {
    verticalRenderClipController: new RenderClip1DController({
      itemsCount: verticalItemsCount,
      itemHeight
    }),
    horizontalRenderClipController: new RenderClip1DController({
      itemsCount: horizontalItemsCount,
      itemWidth
    })
  };

  ctrl.setDomContainer = (domContainer) => {
    ctrl.verticalRenderClipController.setDomContainer(domContainer);
    ctrl.horizontalRenderClipController.setDomContainer(domContainer);
  };

  ctrl.setItemsCount = ({verticalItemsCount, horizontalItemsCount}) => {
    ctrl.verticalRenderClipController.setItemsCount(verticalItemsCount);
    ctrl.horizontalRenderClipController.setItemsCount(horizontalItemsCount);
  };

  ctrl.refresh = () => {
    ctrl.verticalRenderClipController.refresh();
    ctrl.horizontalRenderClipController.refresh();
  };

  ctrl.onScroll = () => {
    ctrl.verticalRenderClipController.onScroll();
    ctrl.horizontalRenderClipController.onScroll();
  };

  ctrl.updateLayout = () => {
    if (ctrl.verticalRenderClipController.updateLayout) {
      ctrl.verticalRenderClipController.updateLayout();
    }

    if (ctrl.horizontalRenderClipController.updateLayout) {
      ctrl.horizontalRenderClipController.updateLayout();
    }
  };

  return ctrl;
});
