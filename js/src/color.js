var NamedFunction, Style, ansi, capitalize, defaultPalettes, define, defineStyleAttributes, hooker, isNodeJS, ref, setKind, setType, stripAnsi, sync,
  slice = [].slice;

ref = require("type-utils"), setType = ref.setType, setKind = ref.setKind;

sync = require("io").sync;

NamedFunction = require("named-function");

capitalize = require("capitalize");

stripAnsi = require("strip-ansi");

isNodeJS = require("isNodeJS");

define = require("define");

hooker = require("hooker");

ansi = require("ansi-256-colors");

module.exports = function(log, opts) {
  var colors, palettes;
  if (log.color instanceof Object) {
    palettes = log.color.palettes;
  }
  if (palettes == null) {
    palettes = module.exports.defaultPalettes;
  }
  colors = Object.keys(palettes.bright);
  hooker.hook(log, "_printChunk", function(chunk) {
    if (this.isColorful) {
      return;
    }
    if (chunk.message == null) {
      return;
    }
    return chunk.message = stripAnsi(chunk.message);
  });
  define(log, function() {
    this.options = {};
    defineStyleAttributes(colors, function(key, value) {
      var finalize, style;
      finalize = function(messages) {
        return log.apply(log, messages);
      };
      style = Style({
        log: log,
        colors: colors,
        finalize: finalize
      });
      style[key] = value;
      return style;
    });
    this.configurable = false;
    return this({
      isColorful: {
        value: opts.colorful || true
      },
      color: {
        value: {
          palettes: palettes
        }
      }
    });
  });
  define(log.color, function() {
    this.options = {};
    return defineStyleAttributes(colors, function(key, value) {
      var finalize, style;
      finalize = function(messages) {
        return messages.join("");
      };
      style = Style({
        log: log,
        colors: colors,
        finalize: finalize
      });
      style[key] = value;
      return style;
    });
  });
  return null;
};

defaultPalettes = {
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

Style = NamedFunction("Style", function(arg) {
  var colors, finalize, log, palettes, style;
  log = arg.log, finalize = arg.finalize, colors = arg.colors;
  palettes = log.color.palettes;
  style = function() {
    var messages, palette, ref1;
    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (!isNodeJS || log.isQuiet || !log.isColorful) {
      return finalize(messages);
    }
    palette = (ref1 = style.palette) != null ? ref1 : style.isDim ? "dim" : "bright";
    colors = palettes[palette];
    if (style.isBold) {
      messages.unshift("\x1b[1m");
      messages.push("\x1b[22m");
    }
    if (style.fg != null) {
      messages.unshift(ansi.fg.getRgb.apply(null, colors[style.fg]));
    }
    if (style.bg != null) {
      messages.unshift(ansi.bg.getRgb.apply(null, colors[style.bg]));
    }
    if ((style.fg != null) || (style.bg != null)) {
      messages.push(ansi.reset);
    }
    return finalize(messages);
  };
  setType(style, Style);
  return define(style, function() {
    this.options = null;
    this({
      fg: null,
      bg: null,
      palette: null,
      isBold: false,
      isDim: false
    });
    return defineStyleAttributes(colors, function(key, value) {
      style[key] = value;
      return style;
    });
  });
});

define(function() {
  this.options = {
    configurable: false
  };
  this(module.exports, {
    defaultPalettes: {
      value: defaultPalettes
    }
  });
  this.writable = false;
  return this(module.exports, {
    Style: Style
  });
});

setKind(Style, Function);

defineStyleAttributes = function(colors, setAttribute) {
  sync.each(colors, function(color) {
    define(color, {
      get: function() {
        return setAttribute("fg", color);
      }
    });
    return define("bg" + capitalize(color), {
      get: function() {
        return setAttribute("bg", color);
      }
    });
  });
  return define({
    dim: {
      get: function() {
        return setAttribute("isDim", true);
      }
    },
    bold: {
      get: function() {
        return setAttribute("isBold", true);
      }
    }
  });
};

//# sourceMappingURL=../../map/src/color.map
