var Line, Logger, define, getLogOptions, isKind, isNodeEnv, log;

require("lotus-require");

isKind = require("type-utils").isKind;

define = require("define");

isNodeEnv = require("is-node-env");

Logger = require("./logger");

Line = require("./line");

getLogOptions = function() {
  var opts;
  opts = {
    mixins: [require("./stack"), require("./cursor")]
  };
  if (isNodeEnv) {
    opts.process = process;
  } else {
    opts.print = function(message) {
      return console.log(message);
    };
  }
  return opts;
};

log = module.exports = Logger(getLogOptions());

log.error = log.error.bind(log);

if (!isNodeEnv) {
  window.log = log;
}

require("temp-log")._ = log;

define(function() {
  this.options = {
    configurable: false,
    writable: false
  };
  this(Logger, {
    log: log
  });
  return this(log, {
    Logger: Logger
  });
});

//# sourceMappingURL=../../map/src/log.map
