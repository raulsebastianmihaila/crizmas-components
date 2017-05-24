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
