(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  function debounce(func, delay) {
    let timeout;

    return function (...args) {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  function throttle(func, delay) {
    let timeout;

    return function (...args) {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;

          func.apply(this, args);
        }, delay);
      }
    };
  }

  const moduleExports = {
    debounce,
    throttle
  };

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmasFuncUtils = moduleExports;
  }
})();
