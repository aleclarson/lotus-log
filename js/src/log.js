var Logger, isNodeJS, log, options;

require("lotus-require");

isNodeJS = require("isNodeJS");

options = {};

options.mixins = [require("./cursor")];

if (isNodeJS) {
  options.process = process;
} else {
  options.print = function(message) {
    return console.log(message);
  };
}

Logger = require("./logger");

module.exports = log = Logger(options);

log.Logger = Logger;

require("temp-log")._ = log;

//# sourceMappingURL=../../map/src/log.map
