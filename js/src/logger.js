var Event, Factory, Formatter, KeyMirror, Line, Logger, Nan, Null, Void, assertType, childProcess, concatArgs, defaultNewline, inArray, isType, mixins, ref, repeatString, stripAnsi, sync;

require("isNodeJS");

ref = require("type-utils"), Void = ref.Void, Null = ref.Null, Nan = ref.Nan, isType = ref.isType, assertType = ref.assertType;

repeatString = require("repeat-string");

childProcess = require("child_process");

stripAnsi = require("strip-ansi");

KeyMirror = require("keymirror");

inArray = require("in-array");

Factory = require("factory");

Event = require("event");

sync = require("sync");

concatArgs = require("./concatArgs");

Formatter = require("./Formatter");

Line = require("./Line");

if (isNodeJS) {
  defaultNewline = (require("os")).EOL;
} else {
  defaultNewline = "\n";
}

mixins = [require("./mixins/indent"), require("./mixins/flags"), require("./mixins/color")];

module.exports = Logger = Factory("Logger", {
  statics: {
    Line: Line,
    mixins: mixins
  },
  kind: Function,
  customValues: {
    size: {
      get: function() {
        if (!(this.process && this.process.stdout && this.process.stdout.isTTY)) {
          return null;
        }
        return this.process.stdout.getWindowSize();
      }
    },
    line: {
      get: function() {
        return this.lines[this._line];
      }
    },
    _line: {
      didSet: function(newValue) {
        if (this.lines[newValue] != null) {
          return;
        }
        throw Error("Bad line number: " + newValue);
      }
    }
  },
  initValues: function(options) {
    return {
      ln: defaultNewline,
      lines: [new Line(0)],
      format: null,
      didPrint: Event(),
      _print: options.print
    };
  },
  init: function(options) {
    if (!options.process && !options.print) {
      throw Error("Must provide 'options.process' or 'options.print'!");
    }
    this._line = 0;
    if (isNodeJS && options.process) {
      this.process = options.process;
      if (this.process.stdout) {
        this._print = (function(_this) {
          return function(message) {
            return _this.process.stdout.write(message);
          };
        })(this);
      }
    }
    mixins = options.mixins || [];
    mixins = mixins.concat(Logger.mixins);
    sync.each(mixins, (function(_this) {
      return function(mixin) {
        if (!mixin) {
          return;
        }
        return mixin(_this, options);
      };
    })(this));
    return this.format = Formatter(this);
  },
  func: function() {
    var args, i, index, len, value;
    args = [];
    for (index = i = 0, len = arguments.length; i < len; index = ++i) {
      value = arguments[index];
      args[index] = value;
    }
    this._log(args);
  },
  it: function() {
    this.moat(0);
    this.apply(null, arguments);
    this.moat(0);
  },
  ansi: function(code) {
    if (!isNodeJS) {
      return;
    }
    this._print("\x1b[" + code);
  },
  moat: function(width) {
    var _width;
    assertType(width, Number);
    _width = this._computeMoatFrom(this._line);
    while (_width++ < width) {
      this._printNewLine();
    }
  },
  origin: function(id) {
    this.moat(1);
    this.pink.dim("[" + (new Date).toLocaleTimeString() + "]");
    this(" ");
    this.pink.bold(id);
    return this.moat(0);
  },
  withLabel: function(label, message) {
    this.moat(1);
    this(label);
    this(": ");
    this(message);
    this.moat(1);
  },
  clear: function() {
    if (!isNodeJS) {
      return;
    }
    if (this.process) {
      this.cursor._x = this.cursor._y = 0;
      this._print(childProcess.execSync("printf '\\33c\\e[3J'", {
        encoding: "utf8"
      }));
    }
    this._line = 0;
    this.lines = [new Line(0)];
  },
  clearLine: function(line) {
    var isCurrentLine, message;
    if (!isNodeJS) {
      return;
    }
    line = this.lines[line || this._line];
    if (line == null) {
      throw Error("Missing line: " + line);
    }
    if (this.process) {
      isCurrentLine = line.index === this._line;
      if (isCurrentLine) {
        this.cursor.x = 0;
      } else {
        this.cursor.save();
        this.cursor.move({
          x: 0,
          y: line.index
        });
      }
      message = repeatString(" ", line.length);
      this._printToChunk(message, {
        line: line.index,
        hidden: true
      });
      if (isCurrentLine) {
        this.cursor.x = 0;
      } else {
        this.cursor.restore();
      }
    }
    line.contents = "";
    line.length = 0;
  },
  deleteLine: function() {
    this.lines.pop();
    if (this.process) {
      this.ansi("2K");
      this.cursor.y--;
    } else {
      this._line--;
    }
  },
  _log: function(args) {
    var lastLine, lines;
    if (this.isQuiet) {
      return false;
    }
    args = concatArgs(args);
    lines = args.split(this.ln);
    if (lines.length === 0) {
      return false;
    }
    lastLine = lines.pop();
    sync.each(lines, (function(_this) {
      return function(line) {
        _this._printToChunk(line);
        return _this._printNewLine();
      };
    })(this));
    this._printToChunk(lastLine);
    return true;
  },
  _computeMoatFrom: function(line) {
    var width;
    width = -1;
    while (true) {
      if (this.lines[line].length === 0) {
        width++;
      } else {
        break;
      }
      if (line-- === 0) {
        break;
      }
    }
    return width;
  },
  _printToChunk: function(message, chunk) {
    if (chunk == null) {
      chunk = {};
    }
    chunk.message = message;
    if (chunk.line == null) {
      chunk.line = this._line;
    }
    if (chunk.length == null) {
      chunk.length = stripAnsi(chunk.message).length;
    }
    return this._printChunk(chunk);
  },
  _printChunk: function(chunk) {
    var line;
    assertType(chunk, Object);
    assertType(chunk.message, String);
    assertType(chunk.length, Number);
    if (chunk.length === 0) {
      return false;
    }
    if (chunk.silent !== true) {
      if (isNodeJS) {
        this._print(chunk.message);
      }
      this.didPrint.emit(chunk);
      if (chunk.hidden !== true) {
        line = this.line;
        this.line.contents += chunk.message;
        this.line.length += chunk.length;
      }
    }
    return true;
  },
  _printNewLine: function() {
    var line;
    if (this._line === this.lines.length - 1) {
      if (!isNodeJS) {
        this._print(this.line.contents);
      }
      this._printToChunk(this.ln, {
        hidden: true
      });
      line = Line(this.lines.length);
      this.lines.push(line);
      return this._line = line.index;
    } else if (!isNodeJS) {
      throw Error("Changing a Logger's `_line` property is unsupported outside of NodeJS.");
    } else {
      return this._printToChunk(this.ln, {
        silent: true
      });
    }
  },
  _debugError: function(error, format) {
    if (format.simple === true) {
      return false;
    }
    if (this.process == null) {
      return false;
    }
    return true;
  }
});

//# sourceMappingURL=../../map/src/logger.map
