import React from 'react';
import propTypes from 'prop-types';

import RenderClip from './render-clip/render-clip.js';

const {createElement} = React;

export default class Tree extends React.Component {
  constructor() {
    super();

    this.renderArrayTreeNode = ({index, itemHeight}) => {
      const {controller, indentation, renderExpandToggle} = this.props;
      const {treeArray, toggleExpand} = controller;
      const item = treeArray[index];

      return createElement(
        'div',
        {
          key: index,
          style: {
            height: itemHeight,
            paddingLeft: indentation * item.level
          }
        },
        item.children && renderExpandToggle({item, toggleExpand}),
        item.data.label);
    };
  }

  render() {
    return createElement(RenderClip, {
      controller: this.props.controller.renderClipController,
      renderItem: this.renderArrayTreeNode
    });
  }
}

Tree.propTypes = {
  controller: propTypes.object.isRequired,
  indentation: propTypes.number.isRequired,
  renderExpandToggle: propTypes.func.isRequired
};

Tree.defaultProps = {
  indentation: 20,
  renderExpandToggle: ({item, toggleExpand}) => createElement(
    'span',
    {
      style: {marginRight: 5},
      onClick: toggleExpand.bind(null, item)
    },
    String.fromCodePoint(item.isExpanded ? 9660 : 9658))
};
