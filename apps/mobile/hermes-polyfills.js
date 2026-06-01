// Hermes doesn't define DOMException globally. React Native 0.81 and
// whatwg-fetch both expect it on the global object before any module runs.
// This polyfill is injected via Metro's getPolyfills hook.
if (typeof global.DOMException === 'undefined') {
  function DOMException(message, name) {
    var err = new Error(message);
    this.message = err.message;
    this.name = name || 'DOMException';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DOMException);
    } else {
      this.stack = err.stack;
    }
  }
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
  global.DOMException = DOMException;
}
