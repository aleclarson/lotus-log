var define, emptyFunction, isDev, isNodeJS,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

emptyFunction = require("emptyFunction");

isNodeJS = require("isNodeJS");

define = require("define");

isDev = require("isDev");

module.exports = function(log, options) {
  define(log, {
    isQuiet: false,
    isVerbose: {
      didSet: function(isVerbose) {
        return this._verbose = isVerbose ? this : emptyFunction;
      }
    },
    isDebug: {
      didSet: function(isDebug) {
        return this._debug = isDebug ? this : emptyFunction;
      }
    },
    verbose: function() {
      return this._verbose.apply(this, arguments);
    },
    debug: function() {
      return this._debug.apply(this, arguments);
    },
    _verbose: emptyFunction,
    _debug: emptyFunction
  });
  log.isDebug = (options.debug === true) || (isDev && (options.debug !== false));
  log.isVerbose = options.verbose === true;
  if (isNodeJS) {
    log.isDebug = log.isDebug || (indexOf.call(process.argv, "--debug") >= 0) || (process.env.DEBUG === "true");
    return log.isVerbose = log.isVerbose || (indexOf.call(process.argv, "--verbose") >= 0) || (process.env.VERBOSE === "true");
  }
};

//# sourceMappingURL=../../map/src/flags.map
