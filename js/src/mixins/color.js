var LazyVar, Shape, TextStyle, combine, defaultPalette, isNodeJS, isType, ref, setType;

ref = require("type-utils"), isType = ref.isType, setType = ref.setType, Shape = ref.Shape;

isNodeJS = require("isNodeJS");

LazyVar = require("lazy-var");

combine = require("combine");

TextStyle = require("../TextStyle");

module.exports = function(log, options) {
  var palette, print, shouldAddColors;
  log.color = {};
  palette = options.palette || combine({}, defaultPalette);
  log.palette = palette;
  log.isColorful = options.colorful !== false;
  if (log.process && log.isColorful) {
    log.isColorful = log.process.stdout.isTTY;
  }
  shouldAddColors = function() {
    if (!isNodeJS) {
      return false;
    }
    if (log.isQuiet) {
      return false;
    }
    return log.isColorful;
  };
  print = function(messages) {
    return log._log(messages);
  };
  TextStyle.defineCreators(log, {
    palette: palette,
    print: print,
    shouldAddColors: shouldAddColors
  });
  print = function(messages) {
    return messages.join("");
  };
  return TextStyle.defineCreators(log.color, {
    palette: palette,
    print: print,
    shouldAddColors: shouldAddColors
  });
};

defaultPalette = {
  bright: {
    red: [4, 0, 0],
    blue: [0, 1, 5],
    green: [0, 5, 1],
    cyan: [0, 3, 4],
    white: [5, 5, 5],
    gray: [2, 2, 2],
    yellow: [5, 5, 0],
    pink: [5, 0, 4],
    black: [0, 0, 0]
  },
  dim: {
    red: [2, 0, 0],
    blue: [0, 0, 2],
    green: [0, 2, 1],
    cyan: [0, 1, 2],
    white: [3, 3, 3],
    gray: [1, 1, 1],
    yellow: [2, 2, 0],
    pink: [3, 0, 1],
    black: [0, 0, 0]
  }
};

//# sourceMappingURL=../../../map/src/mixins/color.map
