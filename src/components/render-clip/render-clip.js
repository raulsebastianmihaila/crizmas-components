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

  class RenderClip extends Component {
    constructor() {
      super();

      this.containerRef = React.createRef();
      this.renderedItemsRef = React.createRef();

      this.syncHeightAfterRender = () => {
        const {renderedItemsCount, orthogonalScrollSizeProp, onRender} = this.props.controller;

        if (!renderedItemsCount) {
          return;
        }

        const {mustResetOrthogonalMinSize, mustReapplyLastOperationForSizeSync,
          mustReapplyLastOperationForSizeSyncIfChangesMade,
          lastOperationForSizeSync} = onRender();
        const renderedItemsStyle = this.renderedItemsRef.current.style;
        let changesMade = false;

        if (mustResetOrthogonalMinSize) {
          const currentOrthogonalMinSize = renderedItemsStyle[this.orthogonalMinSizeProp];

          changesMade = currentOrthogonalMinSize !== 'unset';

          // the styles in jsx don't overwrite the styles set here
          renderedItemsStyle[this.orthogonalMinSizeProp] = 'unset';
        } else if (this.props.controller.isOrthogonalOverflow) {
          renderedItemsStyle[this.orthogonalMinSizeProp] =
            `${this.renderedItemsRef.current[orthogonalScrollSizeProp]}px`;
        }

        if (mustReapplyLastOperationForSizeSync
          || changesMade && mustReapplyLastOperationForSizeSyncIfChangesMade) {
          lastOperationForSizeSync();
        }
      };

      this.onWindowResize = () => {
        this.props.controller.refresh();
      };
    }

    get sizeProp() {
      return this.props.controller.isVertical ? 'height' : 'width';
    }

    get orthogonalSizeProp() {
      return this.props.controller.isVertical ? 'width' : 'height';
    }

    get orthogonalMinSizeProp() {
      return this.props.controller.isVertical ? 'minWidth' : 'minHeight';
    }

    get paddingPosition() {
      return this.props.controller.isVertical ? 'top' : 'left';
    }

    get overflowProp() {
      return this.props.controller.isVertical ? 'overflowY' : 'overflowX';
    }

    get translateProp() {
      return this.props.controller.isVertical ? 'translateY' : 'translateX';
    }

    get itemSizeProp() {
      return this.props.controller.isVertical ? 'itemHeight' : 'itemWidth';
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
        controller: {renderedItemsStartIndex, renderedItemsCount, trimmedStartNegativeSize,
          virtualTotalItemsSize, realItemSize, isScrollVirtualized, items, onScroll},
        renderItem
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
        renderedItemsCount && createElement('div', {
            ref: this.renderedItemsRef,
            style: isScrollVirtualized
              ? {
                position: 'sticky',
                [this.paddingPosition]: 0,
                [this.orthogonalSizeProp]: fitContentValue,
                [this.sizeProp]: '100%',
                [this.overflowProp]: 'hidden'
              }
              : null
          },
          createElement('div', {
              style: {transform: `${this.translateProp}(${trimmedStartNegativeSize}px)`}
            },
            Array.from({length: renderedItemsCount}, (v, index) => {
              const itemIndex = renderedItemsStartIndex + index;

              return renderItem({
                index: itemIndex,
                [this.itemSizeProp]: realItemSize,
                ...items && {item: items[itemIndex]}
              });
            }))),
        renderedItemsCount && isScrollVirtualized && createElement('div', {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: -1,
            [this.orthogonalSizeProp]: '100%',
            [this.sizeProp]: virtualTotalItemsSize
          }
        }));
    }
  }

  RenderClip.propTypes = {
    controller: PropTypes.object.isRequired,
    renderItem: PropTypes.func.isRequired
  };

  const moduleExports = RenderClip;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.RenderClip = moduleExports;
  }
})();
