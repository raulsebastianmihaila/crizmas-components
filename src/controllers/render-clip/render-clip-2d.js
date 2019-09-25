(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let Mvc;
  let RenderClip1DController;

  if (isModule) {
    Mvc = require('crizmas-mvc');
    RenderClip1DController = require('./render-clip-1d');
  } else {
    ({Mvc, RenderClip1DController} = window.crizmas);
  }

  const RenderClip2DController = Mvc.controller(function RenderClip2DController({
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

  const moduleExports = RenderClip2DController;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.RenderClip2DController = moduleExports;
  }
})();
