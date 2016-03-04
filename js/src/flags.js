var define, noop,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

noop = require("no-op");

define = require("define");

module.exports = function(log, opts) {
  var debug, spinner, verbose;
  verbose = noop;
  debug = noop;
  spinner = null;
  define(log, function() {
    this.options = {
      configurable: false
    };
    this({
      isQuiet: false,
      isVerbose: {
        didSet: function(isVerbose) {
          return verbose = isVerbose ? this : noop;
        }
      },
      isDebug: {
        didSet: function(isDebug) {
          return debug = isDebug ? this : noop;
        }
      }
    });
    this.writable = false;
    return this({
      verbose: function() {
        return verbose.apply(this, arguments);
      },
      debug: function() {
        return debug.apply(this, arguments);
      }
    });
  });
  log.isDebug = (opts.debug === true) || ((global.__DEV__ === true) && (opts.debug !== false));
  log.isVerbose = opts.verbose === true;
  if (typeof process !== "undefined") {
    log.isDebug = log.isDebug || (indexOf.call(process.argv, "--debug") >= 0) || (process.env.DEBUG === "true");
    return log.isVerbose = log.isVerbose || (indexOf.call(process.argv, "--verbose") >= 0) || (process.env.VERBOSE === "true");
  }
};

//# sourceMappingURL=../../map/src/flags.map
