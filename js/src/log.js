var Logger, log, options;

require("isNodeJS");

options = {};

options.mixins = [require("./mixins/cursor")];

if (isNodeJS) {
  options.process = process;
} else {
  options.print = function(message) {
    return console.log(message);
  };
}

Logger = require("./Logger");

module.exports = log = Logger(options);

log.Logger = Logger;

require("temp-log")._ = log;

//# sourceMappingURL=../../map/src/log.map
