<a name="2.1.1"></a>
# [2.1.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v2.1.0...v2.1.1) (2021-10-30)

### Fixes
- Ensure that by default the render-clip components can receive focus.

<a name="2.1.0"></a>
# [2.1.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v2.0.4...v2.1.0) (2021-10-24)

### Updates
- Added prop to render-clip components to allow preventing focus with the tab key.

<a name="2.0.4"></a>
# [2.0.4](https://github.com/raulsebastianmihaila/crizmas-components/compare/v2.0.3...v2.0.4) (2021-10-19)

### Fixes
- Handle newly discovered edge case in floating point arithmetic used in scroll virtualization.
- Slow down scrolling using the wheel in translated scroll virtualization when it's too fast.

<a name="2.0.3"></a>
# [2.0.3](https://github.com/raulsebastianmihaila/crizmas-components/compare/v2.0.2...v2.0.3) (2021-08-22)

### Updates
- Updated crizmas-mvc, prop-types, react and smart-mix peer dependencies.

<a name="2.0.2"></a>
# [2.0.2](https://github.com/raulsebastianmihaila/crizmas-components/compare/v2.0.1...v2.0.2) (2021-01-25)

### Fixes
- Fix stale onChange and onBlur props.

<a name="2.0.1"></a>
# [2.0.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v2.0.0...v2.0.1) (2021-01-03)

### Updates
- Added support for React 17.

<a name="2.0.0"></a>
# [2.0.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.5.3...v2.0.0) (2021-01-01)

### Breaking changes
- Dropped support for non-module script tags.

### Updates
- Moved from commonjs modules to standard ES modules.
- Updated crizmas-mvc and smart-mix peer dependencies.

<a name="1.5.3"></a>
# [1.5.3](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.5.2...v1.5.3) (2020-11-30)

### Fixes
- Fix `onBlur` by debouncing it the same as `onChange` is debounced to prevent validating with the blur event too early when `onChange` is debounced.

<a name="1.5.2"></a>
# [1.5.2](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.5.1...v1.5.2) (2020-07-26)

### Fixes
- Fix initializing the value change logic when the `onChange` prop changes.

<a name="1.5.1"></a>
# [1.5.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.5.0...v1.5.1) (2020-06-14)

### Updates
- Performance improvement for individual size render-clip.

<a name="1.5.0"></a>
# [1.5.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.4.2...v1.5.0) (2020-06-08)

### Updates
- Add `stretch` prop to `RenderClip`.
- Small refactoring.

<a name="1.4.2"></a>
# [1.4.2](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.4.1...v1.4.2) (2019-09-29)

### Updates
- Refactoring, including removing `setTimeout`.

<a name="1.4.1"></a>
# [1.4.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.4.0...v1.4.1) (2019-09-28)

### Fixes
- Fix scrolls synchronization for `scrollTo` like operations.

<a name="1.4.0"></a>
# [1.4.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.3.0...v1.4.0) (2019-09-28)

### Updates
- Add `updateLayout` for render-clip controllers with individual size per item.

<a name="1.3.0"></a>
# [1.3.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.2.0...v1.3.0) (2019-09-07)

### Updates
- Added support for render-clip for Safari.
- Refactored render-clip.
- Updated the version of smart-mix peer dependency.

<a name="1.2.0"></a>
# [1.2.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.1.0...v1.2.0) (2019-02-16)

### Updates
- Allow specifying individual sizes for items for `RenderClipController` and `RenderClip2DController`.

### Fixes
- Fix the scroll position when changing the `RenderClip` items from virtualized to non-virtualized.

<a name="1.1.0"></a>
# [1.1.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.0.3...v1.1.0) (2019-01-29)

### Updates
- Add render clip and tree components and controllers.

<a name="1.0.3"></a>
# [1.0.3](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.0.2...v1.0.3) (2018-12-08)

### Updates
- Update crizmas-utils, react and prop-types peer dependencies.
- Replace deprecated componentWillReceiveProps with componentDidUpdate.

### Fixes
- Fix stale debounce prop.

<a name="1.0.2"></a>
# [1.0.2](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.0.1...v1.0.2) (2018-04-21)

### Updates
- Updated the version of crizmas-utils peer dependency.
- Add MIT license to package.json.

<a name="1.0.1"></a>
# [1.0.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v1.0.0...v1.0.1) (2017-11-18)

### Updates
- Updated the version of react peer dependency.

<a name="1.0.0"></a>
# [1.0.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.3.3...v1.0.0) (2017-07-30)

### Updates
- Updated the version of crizmas-utils peer dependency.

<a name="0.3.3"></a>
# [0.3.3](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.3.2...v0.3.3) (2017-06-23)

### Updates
- Avoid using `React.DOM`.

<a name="0.3.2"></a>
# [0.3.2](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.3.1...v0.3.2) (2017-06-22)

### Updates
- Small style improvement.

<a name="0.3.1"></a>
# [0.3.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.3.0...v0.3.1) (2017-05-28)

### Updates
- Allow more HTML input types and textarea.
- Added `crizmas-input` and `has-errors` css classes.
- Added `inputClassName` and `inputProps` props.

### Fixes
- Fix checking the new value prop in `componentWillReceiveProps` so that the input value is not changed.

<a name="0.3.0"></a>
# [0.3.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.2.5...v0.3.0) (2017-05-14)

### Breaking changes
- Removed the throttle function.
- Changed the export namespace of utils to `componentUtils`.

### Updates
- Allow Infinity from the input as the string is not displayed anymore.
- Small refactoring.
- Add prop-types as a peer dependency.
- Update version of react peer dependency.

<a name="0.2.5"></a>
# [0.2.5](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.2.4...v0.2.5) (2017-05-07)

### Updates
- Add `crizmas-utils` as a peer dependency.
- Small refactoring.

<a name="0.2.4"></a>
# [0.2.4](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.2.3...v0.2.4) (2017-04-29)

### Fixes
- Set `oldValue` before calling `onChange`.

### Updates
- Ensure that functions that should not be constructed are not constructors.

<a name="0.2.3"></a>
# [0.2.3](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.2.2...v0.2.3) (2017-02-17)

### Fixes
- Make sure the input value cannot be changed from outside while the input is input pending.

### Updates
- Bool type now has a 0 default debounce.

<a name="0.2.2"></a>
# [0.2.2](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.2.1...v0.2.2) (2017-02-15)

### Fixes
- Prevent the infinity value for type number and integer.
- Don't call onStartPending and onChange if the value change guard returns false.
- Add the checked prop and other input props.

<a name="0.2.1"></a>
# [0.2.1](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.2.0...v0.2.1) (2017-02-13)

### Fixes
- Check if the component is still mounted when setting the state in debounced onChange.

<a name="0.2.0"></a>
# [0.2.0](https://github.com/raulsebastianmihaila/crizmas-components/compare/v0.1.0...v0.2.0) (2016-12-29)

### Breaking changes
- Add the `crizmas` namespace as a prop on `window`.

<a name="0.1.0"></a>
# 0.1.0 (2016-12-21)

- Init
