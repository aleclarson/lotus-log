var Factory, NamedFunction, Shape, TextStyle, ansi, define, isNodeJS, ref, setType, sync;

ref = require("type-utils"), setType = ref.setType, Shape = ref.Shape;

NamedFunction = require("named-function");

isNodeJS = require("isNodeJS");

Factory = require("factory");

define = require("define");

ansi = require("ansi-256-colors");

sync = require("sync");

module.exports = function(log, options) {
  var palettes;
  log.isColorful = options.colorful !== false;
  if (log.process && log.isColorful) {
    log.isColorful = log.process.stdout.isTTY;
  }
  palettes = options.palettes || exports.defaultPalettes;
  log.color = {};
  TextStyle.defineCreators(log.color, palettes, function(messages) {
    return messages.join("");
  });
  return TextStyle.defineCreators(log, palettes, function(messages) {
    return log._log(messages);
  });
};

exports.defaultPalettes = {
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

exports.TextStyle = TextStyle = Factory("TextStyle", {
  statics: {
    defineCreators: function(target, palettes, print) {
      var colors;
      colors = Object.keys(palettes.bright);
      return TextStyle.defineAttributes(target, colors, function(key, value) {
        var style;
        style = TextStyle({
          palettes: palettes,
          print: print
        });
        style[key] = value;
        return style;
      });
    },
    defineAttributes: function(target, colors, setAttribute) {
      var attributes;
      attributes = sync.reduce(colors, {}, function(attributes, key) {
        attributes[key] = {
          get: function() {
            return setAttribute("fg", key);
          }
        };
        return attributes;
      });
      attributes.dim = {
        get: function() {
          return setAttribute("isDim", true);
        }
      };
      attributes.bold = {
        get: function() {
          return setAttribute("isBold", true);
        }
      };
      return define(target, attributes);
    }
  },
  kind: Function,
  optionTypes: {
    palettes: Shape({
      bright: Object,
      dim: Object
    }),
    print: Function
  },
  initValues: function(options) {
    return {
      palettes: options.palettes,
      print: options.print
    };
  },
  init: function() {
    var colors;
    colors = Object.keys(this.palettes.bright);
    return TextStyle.defineAttributes(this, colors, (function(_this) {
      return function(key, value) {
        _this[key] = value;
        return _this;
      };
    })(this));
  },
  func: function() {
    var args, colors, i, index, len, value;
    args = [];
    for (index = i = 0, len = arguments.length; i < len; index = ++i) {
      value = arguments[index];
      args[index] = value;
    }
    if (!isNodeJS || log.isQuiet || !log.isColorful) {
      return this.print(args);
    }
    colors = this.palettes[this.isDim ? "dim" : "bright"];
    if (this.isBold) {
      args.unshift("\x1b[1m");
      args.push("\x1b[22m");
    }
    if (this.fg && colors[this.fg]) {
      args.unshift(ansi.fg.getRgb.apply(null, colors[this.fg]));
      args.push(ansi.reset);
    }
    return this.print(args);
  }
});

//# sourceMappingURL=../../map/src/color.map
