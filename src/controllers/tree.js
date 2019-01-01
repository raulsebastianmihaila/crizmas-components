(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let Mvc;
  let RenderClipController;

  if (isModule) {
    Mvc = require('crizmas-mvc');
    RenderClipController = require('./render-clip/render-clip');
  } else {
    ({Mvc, RenderClipController} = window.crizmas);
  }

  const TreeController = Mvc.controller(function TreeController({nodes: nodes_, itemHeight}) {
    // the nodes are a tree of objects with optional children and isExpanded properties
    // and any other possible properties

    let nodes = nodes_;
    let tree;
    let treeArray;
    const ctrl = {
      renderClipController: new RenderClipController({itemHeight}),

      get treeArray() {
        return treeArray;
      }
    };

    const init = () => {
      initTreeItems();
      initTreeArray();
    };

    const initTreeItems = () => {
      tree = getTreeNodes(nodes, 0);
    };

    const getTreeNodes = (nodes, level) => {
      const childrenLevel = level + 1;

      return nodes.map((node) => ({
        data: node,
        level,
        isExpanded: !!node.children && !!node.isExpanded,
        children: node.children
          ? getTreeNodes(node.children, childrenLevel)
          : null
      }));
    };

    const initTreeArray = () => {
      treeArray = getTreeArray(tree);

      ctrl.renderClipController.setItemsCount(treeArray.length);
    };

    const getTreeArray = (treeNodes, treeArray = []) => {
      treeNodes.forEach((treeNode) => {
        treeArray.push(treeNode);

        if (treeNode.isExpanded) {
          getTreeArray(treeNode.children, treeArray);
        }
      });

      return treeArray;
    };

    ctrl.setNodes = (nodes_) => {
      nodes = nodes_;

      init();
    };

    ctrl.refresh = () => {
      ctrl.renderClipController.refresh();
    };

    ctrl.toggleExpand = (treeNode) => {
      const treeNodeIndex = treeArray.indexOf(treeNode);

      treeNode.isExpanded = !treeNode.isExpanded;

      if (treeNode.isExpanded) {
        const nodeSubtreeArray = getTreeArray(treeNode.children);
        const prevArray = treeArray.slice(0, treeNodeIndex + 1);
        const afterArray = treeArray.slice(treeNodeIndex + 1);

        treeArray = [
          ...prevArray,
          ...nodeSubtreeArray,
          ...afterArray
        ];

        ctrl.renderClipController.setItemsCount(treeArray.length);
      } else {
        const nodeSubtreeLength = getSubTreeNodeLength(treeNode);

        treeArray.splice(treeNodeIndex + 1, nodeSubtreeLength);
        ctrl.renderClipController.setItemsCount(treeArray.length);
      }
    };

    const getSubTreeNodeLength = (treeNode) => {
      return treeNode.children
        ? treeNode.children.reduce(
          (sum, childTreeNode) => sum + 1
            + (childTreeNode.isExpanded ? getSubTreeNodeLength(childTreeNode) : 0),
          0)
        : 0;
    };

    init();

    return ctrl;
  });

  const moduleExports = TreeController;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.TreeController = moduleExports;
  }
})();
