let fitContentValue;
let stickyValue;

export const debounce = (func, delay) => {
  let timeout;
  let isScheduled;
  let that;
  let args;

  const commit = () => {
    if (isScheduled) {
      isScheduled = false;

      clearTimeout(timeout);
      func.apply(that, args);
    }
  };

  // make sure the function is not a constructor
  const debouncedFunc = ({
    function(...args_) {
      that = this;
      args = args_;
      isScheduled = true;

      clearTimeout(timeout);

      timeout = setTimeout(
        () => {
          isScheduled = false;

          func.apply(this, args);
        },

        delay);
    }
  }).function;

  debouncedFunc.commit = commit;

  return debouncedFunc;
};

export const getFitContentValue = () => {
  if (!fitContentValue) {
    fitContentValue = detectFitContentValue();
  }

  return fitContentValue;
};

const detectFitContentValue = () => {
  const div = document.createElement('div');

  div.style.width = 'fit-content';

  if (div.style.width === 'fit-content') {
    return 'fit-content';
  }

  return '-moz-fit-content';
};

export const getStickyValue = () => {
  if (!stickyValue) {
    stickyValue = detectStickyValue();
  }

  return stickyValue;
};

const detectStickyValue = () => {
  const div = document.createElement('div');

  div.style.position = 'sticky';

  if (div.style.position === 'sticky') {
    return 'sticky';
  }

  // Safari requires the prefix
  return '-webkit-sticky';
};
