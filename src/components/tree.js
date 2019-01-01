(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let React;
  let PropTypes;
  let RenderClip;

  if (isModule) {
    React = require('react');
    PropTypes = require('prop-types');
    RenderClip = require('./render-clip/render-clip');
  } else {
    React = window.React;
    PropTypes = window.PropTypes;
    ({RenderClip} = window.crizmas);
  }

  const {Component, createElement} = React;

  class Tree extends Component {
    constructor() {
      super();

      this.renderArrayTreeNode = ({index, itemHeight}) => {
        const {controller, indentation, renderExpandToggle} = this.props;
        const {treeArray, toggleExpand} = controller;
        const item = treeArray[index];

        return createElement('div', {
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
    controller: PropTypes.object.isRequired,
    indentation: PropTypes.number.isRequired,
    renderExpandToggle: PropTypes.func.isRequired
  };

  Tree.defaultProps = {
    indentation: 20,
    renderExpandToggle: ({item, toggleExpand}) => createElement('span', {
        style: {marginRight: 5},
        onClick: toggleExpand.bind(null, item)
      },
      String.fromCodePoint(item.isExpanded ? 9660 : 9658))
  };

  const moduleExports = Tree;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.Tree = moduleExports;
  }
})();
