(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let React;
  let PropTypes;
  let componentUtils;

  if (isModule) {
    React = require('react');
    PropTypes = require('prop-types');
    componentUtils = require('../../utils');
  } else {
    React = window.React;
    PropTypes = window.PropTypes;
    ({componentUtils} = window.crizmas);
  }

  const {Component, createElement} = React;
  const {getFitContentValue} = componentUtils;

  const fitContentValue = getFitContentValue();

  class RenderClip2D extends Component {
    constructor() {
      super();

      this.containerRef = React.createRef();

      this.syncHeightAfterRender = () => {
        if (!this.props.controller.verticalRenderClipController.renderedItemsCount
          || !this.props.controller.horizontalRenderClipController.renderedItemsCount) {
          return;
        }

        const {mustReapplyLastOperationForSizeSync: mustReapplyVerticalLastOperationForSizeSync,
          lastOperationForSizeSync: verticalLastOperationForSizeSync} =
          this.props.controller.verticalRenderClipController.onRender();
        const {mustReapplyLastOperationForSizeSync: mustReapplyHorizontalLastOperationForSizeSync,
          lastOperationForSizeSync: horizontalLastOperationForSizeSync} =
          this.props.controller.horizontalRenderClipController.onRender();

        if (mustReapplyVerticalLastOperationForSizeSync) {
          verticalLastOperationForSizeSync();
        }

        if (mustReapplyHorizontalLastOperationForSizeSync) {
          horizontalLastOperationForSizeSync();
        }
      };

      this.onWindowResize = () => {
        this.props.controller.refresh();
      };
    }

    componentDidMount() {
      this.props.controller.setDomContainer(this.containerRef.current);
      window.addEventListener('resize', this.onWindowResize);
    }

    componentDidUpdate(prevProps) {
      if (this.props.controller !== prevProps.controller) {
        this.props.controller.setDomContainer(this.containerRef.current);
      }

      this.syncHeightAfterRender();
    }

    componentWillUnmount() {
      this.props.controller.setDomContainer(null);
      window.removeEventListener('resize', this.onWindowResize);
    }

    render() {
      const {
        controller: {verticalRenderClipController, horizontalRenderClipController, onScroll},
        renderRow,
        renderCell
      } = this.props;

      return createElement('div', {
          ref: this.containerRef,
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            whiteSpace: 'nowrap'
          },
          onScroll
        },
        !!verticalRenderClipController.renderedItemsCount
          && !!horizontalRenderClipController.renderedItemsCount
          && createElement('div', {
              style: {
                position: 'sticky',
                top: verticalRenderClipController.isScrollVirtualized ? 0 : 'unset',
                left: horizontalRenderClipController.isScrollVirtualized ? 0 : 'unset',
                height: verticalRenderClipController.isScrollVirtualized
                  ? '100%'
                  : horizontalRenderClipController.isScrollVirtualized
                    ? fitContentValue
                    : 'unset',
                width: horizontalRenderClipController.isScrollVirtualized
                  ? '100%'
                  : verticalRenderClipController.isScrollVirtualized
                    ? fitContentValue
                    : 'unset',
                overflowY: verticalRenderClipController.isScrollVirtualized
                  ? 'hidden'
                  : 'unset',
                overflowX: horizontalRenderClipController.isScrollVirtualized
                  ? 'hidden'
                  : 'unset'
              }
            },
            createElement('div', {
                style: {transform: `translateY(${
                  verticalRenderClipController.trimmedStartNegativeSize}px) translateX(${
                  horizontalRenderClipController.trimmedStartNegativeSize}px)`}
              },
              Array.from(
                {length: verticalRenderClipController.renderedItemsCount},
                (v, index) => {
                  const rowIndex = verticalRenderClipController.renderedItemsStartIndex + index;

                  return renderRow({
                    index: rowIndex,
                    itemHeight: verticalRenderClipController.getRealItemSize(rowIndex),
                    renderCells: () => Array.from(
                      {length: horizontalRenderClipController.renderedItemsCount},
                      (v, index) => {
                        const cellIndex = horizontalRenderClipController.renderedItemsStartIndex
                          + index;

                        return renderCell({
                          index: cellIndex,
                          itemWidth: horizontalRenderClipController.getRealItemSize(cellIndex),
                          itemHeight: verticalRenderClipController.getRealItemSize(rowIndex),
                          rowIndex
                        });
                      })
                  });
                }))),
        !!verticalRenderClipController.renderedItemsCount
          && verticalRenderClipController.isScrollVirtualized
          && createElement('div', {
            style: {
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: -1,
              width: '100%',
              height: verticalRenderClipController.virtualTotalItemsSize
            }
          }),
        !!horizontalRenderClipController.renderedItemsCount
          && horizontalRenderClipController.isScrollVirtualized
          && createElement('div', {
            style: {
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: -1,
              height: '100%',
              width: horizontalRenderClipController.virtualTotalItemsSize
            }
          }));
    }
  }

  RenderClip2D.propTypes = {
    controller: PropTypes.object.isRequired,
    renderRow: PropTypes.func.isRequired,
    renderCell: PropTypes.func.isRequired
  };

  const moduleExports = RenderClip2D;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.RenderClip2D = moduleExports;
  }
})();
