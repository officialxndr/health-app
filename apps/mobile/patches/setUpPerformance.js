'use strict';
// Patched setUpPerformance: replaces the react-native 0.81 implementation that
// triggers a Hermes bytecode TDZ bug on iOS (Property 'X' doesn't exist errors).
// Provides the same global.performance object but without the broken module tree.
if (!global.performance) {
  global.performance = {
    now: function () {
      return (global.nativePerformanceNow || Date.now)();
    },
    mark: function () {},
    measure: function () {},
    clearMarks: function () {},
    clearMeasures: function () {},
    getEntries: function () { return []; },
    getEntriesByName: function () { return []; },
    getEntriesByType: function () { return []; },
    eventCounts: new Map(),
  };
}
