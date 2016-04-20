var Factory, Palette, Shape, TextStyle, ansi, concatArgs, define, sync;

Shape = require("type-utils").Shape;

Factory = require("factory");

define = require("define");

ansi = require("ansi-256-colors");

sync = require("sync");

concatArgs = require("./concatArgs");

Palette = Shape("Palette", {
  bright: Object,
  dim: Object
});

module.exports = TextStyle = Factory("TextStyle", {
  statics: {
    defineCreators: function(target, options) {
      var colors;
      colors = Object.keys(options.palette.bright);
      return TextStyle.defineAttributes(target, colors, function(key, value) {
        var style;
        style = TextStyle(options);
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
    palette: Palette,
    print: Function,
    shouldAddColors: Function
  },
  initValues: function(options) {
    return {
      palette: options.palette,
      print: options.print,
      shouldAddColors: options.shouldAddColors
    };
  },
  init: function() {
    var colors;
    colors = Object.keys(this.palette.bright);
    return TextStyle.defineAttributes(this, colors, (function(_this) {
      return function(key, value) {
        _this[key] = value;
        return _this;
      };
    })(this));
  },
  func: function() {
    var args, colors, i, index, j, len, len1, line, lines, value;
    args = [];
    for (index = i = 0, len = arguments.length; i < len; index = ++i) {
      value = arguments[index];
      args[index] = value;
    }
    if (!this.shouldAddColors()) {
      return this.print(args);
    }
    colors = this.palette[this.isDim ? "dim" : "bright"];
    lines = concatArgs(args).split("\n");
    for (j = 0, len1 = lines.length; j < len1; j++) {
      line = lines[j];
      if (this.isBold) {
        args.unshift("\x1b[1m");
        args.push("\x1b[22m");
      }
      if (this.fg && colors[this.fg]) {
        args.unshift(ansi.fg.getRgb.apply(null, colors[this.fg]));
        args.push(ansi.reset);
      }
    }
    return this.print(args);
  }
});

//# sourceMappingURL=../../map/src/TextStyle.map
