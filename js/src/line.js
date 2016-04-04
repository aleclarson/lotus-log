var Factory, isType;

isType = require("type-utils").isType;

Factory = require("factory");

module.exports = Factory("Line", {
  initArguments: function(arg) {
    if (isType(arg, Number)) {
      arg = {
        index: arg
      };
    }
    return [arg];
  },
  optionTypes: {
    index: Number,
    contents: String
  },
  optionDefaults: {
    contents: ""
  },
  initValues: function(options) {
    return {
      index: options.index,
      contents: options.contents,
      length: options.contents.length
    };
  }
});

//# sourceMappingURL=../../map/src/Line.map
