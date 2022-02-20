import React from 'react';
import propTypes from 'prop-types';

import {getFitContentValue, getStickyValue} from '../../utils.js';

const {createElement} = React;

const fitContentValue = getFitContentValue();
const stickyValue = getStickyValue();

export default class RenderClip extends React.Component {
  constructor() {
    super();

    this.containerRef = React.createRef();
    this.renderedItemsRef = React.createRef();

    this.onScroll = (e) => {
      if (e.target === this.containerRef.current) {
        this.props.controller.onScroll();
      }
    };

    this.onWheel = () => {
      this.props.controller.onWheel();
    };

    this.syncHeightAfterRender = () => {
      const {renderedItemsCount, orthogonalScrollSizeProp, onRender} = this.props.controller;

      if (!renderedItemsCount || !this.renderedItemsRef.current) {
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
        virtualTotalItemsSize, isScrollVirtualized, items, getRealItemSize},
      renderItem,
      stretch,
      preventTabFocus
    } = this.props;

    return createElement(
      'div',
      {
        ref: this.containerRef,
        tabIndex: preventTabFocus ? -1 : 0,
        style: {
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'auto',
          whiteSpace: 'nowrap'
        },
        onScroll: this.onScroll,
        onWheel: this.onWheel
      },
      !!renderedItemsCount && createElement(
        'div',
        {
          ref: this.renderedItemsRef,
          style: isScrollVirtualized
            ? {
              position: stickyValue,
              [this.paddingPosition]: 0,
              [this.orthogonalSizeProp]: stretch ? '100%' : fitContentValue,
              [this.sizeProp]: '100%',
              [this.overflowProp]: 'hidden'
            }
            : null
        },
        createElement(
          'div',
          {
            style: {transform: `${this.translateProp}(${trimmedStartNegativeSize}px)`}
          },
          Array.from({length: renderedItemsCount}, (v, index) => {
            const itemIndex = renderedItemsStartIndex + index;

            return renderItem({
              index: itemIndex,
              [this.itemSizeProp]: getRealItemSize(itemIndex),
              ...items && {item: items[itemIndex]}
            });
          }))),
      !!renderedItemsCount && isScrollVirtualized && createElement(
        'div',
        {
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
  controller: propTypes.object.isRequired,
  renderItem: propTypes.func.isRequired,
  stretch: propTypes.bool,
  preventTabFocus: propTypes.bool
};
