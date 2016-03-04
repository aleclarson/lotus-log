var EventEmitter, KeyMirror, Line, Logger, NamedFunction, Nan, OS, Void, assertKind, childProcess, define, getKind, getType, inArray, isKind, isNodeEnv, isType, ref, repeatString, setKind, setType, stripAnsi, sync, testKind, throwFailure,
  slice = [].slice;

ref = require("type-utils"), Void = ref.Void, Nan = ref.Nan, isType = ref.isType, getType = ref.getType, setType = ref.setType, isKind = ref.isKind, testKind = ref.testKind, getKind = ref.getKind, setKind = ref.setKind, assertKind = ref.assertKind;

throwFailure = require("failure").throwFailure;

NamedFunction = require("named-function");

repeatString = require("repeat-string");

childProcess = require("child_process");

EventEmitter = require("eventemitter3");

isNodeEnv = require("is-node-env");

stripAnsi = require("strip-ansi");

KeyMirror = require("keymirror");

sync = require("io").sync;

inArray = require("in-array");

define = require("define");

OS = require("os");

Line = require("./line");

Logger = module.exports = NamedFunction("Logger", function(options) {
  var log, mixins, ref1;
  if (!isKind(options, Object)) {
    options = {};
  }
  if (((ref1 = options.process) != null ? ref1.stdout : void 0) != null) {
    if (options.colorful == null) {
      options.colorful = options.process.stdout.isTTY;
    }
    options.print = function(message, encoding) {
      return options.process.stdout.write(message, encoding);
    };
  }
  if (options.print == null) {
    throw Error("either 'options.print' or 'options.process' must exist");
  }
  log = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return log._log(args);
  };
  setType(log, Logger);
  define(log, function() {
    this.options = {};
    this({
      log: log,
      ln: (OS != null ? OS.EOL : void 0) || "\n",
      line: {
        get: function() {
          return this.lines[this._line];
        }
      },
      lines: [new Line(0)],
      process: options.process
    });
    this.mirror(new EventEmitter);
    this.options = {};
    this;
    this.enumerable = false;
    return this({
      _line: {
        assign: 0,
        didSet: function(newValue) {
          if (this.lines[newValue] != null) {
            return;
          }
          this.error.isPretty = false;
          throw Error("Bad line number: " + newValue);
        }
      },
      _print: options.print
    });
  });
  mixins = options.mixins.concat(Logger.mixins);
  sync.each(mixins, function(mixin) {
    return typeof mixin === "function" ? mixin(log, options) : void 0;
  });
  return log;
});

setKind(Logger, Function);

if (!isNodeEnv) {
  window._logArgs = [];
  window._contents = [];
}

define(Logger.prototype, function() {
  this.options = {};
  this({
    it: function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.moat(0);
      this._log(args);
      return this.moat(0);
    },
    format: function(value, opts) {
      if (opts == null) {
        opts = {};
      }
      if (isType(opts, String)) {
        opts = {
          label: opts
        };
      }
      assertKind(opts, Object, "opts");
      this.moat(0);
      if (opts.label != null) {
        this.log(opts.label);
      }
      if (opts.unlimited) {
        opts.maxObjectDepth = Infinity;
        opts.maxObjectKeys = Infinity;
        opts.maxArrayKeys = Infinity;
        opts.maxStringLength = Infinity;
      } else {
        if (opts.maxStringLength == null) {
          opts.maxStringLength = this.format.maxStringLength;
        }
      }
      if (!this._logValue(value, opts)) {
        opts.depth = 0;
        opts.keyPath = "";
        opts.keyPaths = [];
        opts.objects = [];
        if (opts.keyOffset == null) {
          opts.keyOffset = this.format.keyOffset;
        }
        if (opts.showInherited == null) {
          opts.showInherited = this.format.showInherited;
        }
        if (!opts.unlimited) {
          if (opts.maxObjectDepth == null) {
            opts.maxObjectDepth = this.format.maxObjectDepth;
          }
          if (opts.maxObjectKeys == null) {
            opts.maxObjectKeys = this.format.maxObjectKeys;
          }
          if (opts.maxArrayKeys == null) {
            opts.maxArrayKeys = this.format.maxArrayKeys;
          }
        }
        this._logObject(value, opts);
      }
      this.moat(0);
      return this;
    },
    ansi: function(code) {
      if (isNodeEnv) {
        return this._print("\x1b[" + code);
      }
    },
    moat: function(width) {
      var _width, ref1;
      if (!isType(width, Number)) {
        throw TypeError("'width' must be a Number");
      }
      _width = this._computeMoatFrom(this._line);
      if (this.isDebug) {
        if ((ref1 = this._moats) != null) {
          ref1.push({
            width: width,
            _width: _width,
            _line: this._line
          });
        }
      }
      while (_width++ < width) {
        this._printNewLine();
      }
      return this;
    },
    origin: function(id) {
      this.moat(1);
      this.pink.dim("[" + (new Date).toLocaleTimeString() + "]");
      this(" ");
      this.pink.bold(id);
      return this.moat(0);
    },
    error: function(error, format) {
      var label, ref1, ref2;
      if (this.error.isQuiet) {
        return false;
      }
      if (!isNodeEnv) {
        if (console.reportErrorsAsExceptions === true) {
          if (typeof console.reportException === "function") {
            console.reportException(error);
          }
        }
        return;
      }
      if (format == null) {
        if (isKind(error.format, Function)) {
          format = error.format();
        } else if (isKind(error.format, Object)) {
          format = error.format;
        } else {
          format = {};
        }
      }
      if (!this.error.isPretty || (format != null ? format.isPretty : void 0) === false) {
        this.moat(1);
        this.log(error.stack);
        this.moat(1);
        if (format.exit !== false) {
          if ((ref1 = this.process) != null) {
            ref1.exit(0);
          }
        }
        return this;
      }
      if (isType(error.help, String)) {
        error.help = (function() {
          return this;
        }).bind(error.help);
      }
      if (!isKind(error, Error)) {
        if (!arguments.hasOwnProperty(1) && isType(error, Object)) {
          format = error;
          error = Error("No error message provided.");
        } else {
          throw TypeError("'error' must be an Error");
        }
      }
      this.pushIndent(this.indent + 2);
      label = this.color.bgRed(error.constructor.name);
      this.withLabel(label, error.message);
      this._debugError(error, format);
      this.popIndent();
      if (format.exit !== false) {
        if ((ref2 = this.process) != null) {
          ref2.exit(0);
        }
      }
      return this;
    },
    warn: function(message) {
      var label;
      label = this.color.yellow.bold("Warning");
      this.withLabel(label, message);
      this.emit("warn", message);
      return true;
    },
    withLabel: function(label, message) {
      this.moat(1);
      this(label);
      this(": ");
      this(message);
      this.moat(1);
      return this;
    },
    noPrint: {
      value: {}
    },
    size: {
      get: function() {
        if ((this.process != null) && this.process.stdout.isTTY) {
          return this.process.stdout.getWindowSize();
        }
      }
    },
    clear: function() {
      if (!isNodeEnv) {
        return;
      }
      if (this.process != null) {
        this.cursor._x = this.cursor._y = 0;
        this._print(childProcess.execSync("printf '\\33c\\e[3J'", {
          encoding: "utf8"
        }));
      }
      this._line = 0;
      this.lines = [new Line(0)];
      this.emit("clear");
      return this;
    },
    clearLine: function(line) {
      var isCurrentLine;
      line = this.lines[line || this._line];
      if (line == null) {
        throw Error("Missing line: " + line);
      }
      if (this.process != null) {
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
        this._printChunk({
          line: line.index,
          message: repeatString(" ", line.length)
        });
        if (isCurrentLine) {
          this.cursor.x = 0;
        } else {
          this.cursor.restore();
        }
      }
      line.contents = "";
      line.length = 0;
      return this;
    },
    deleteLine: function() {
      this.lines.pop();
      if (this.process != null) {
        this.ansi("2K");
        this.cursor.y--;
      } else {
        this._line--;
      }
      return this;
    }
  });
  this(Logger.prototype.format, {
    maxObjectDepth: 2,
    maxObjectKeys: 30,
    maxArrayKeys: 10,
    maxStringLength: 60,
    keyOffset: 0,
    showInherited: true
  });
  this(Logger.prototype.error, {
    isPretty: false,
    isQuiet: false
  });
  this.enumerable = false;
  return this({
    _log: function(args) {
      var lastLine, lines;
      if (this.isQuiet) {
        return false;
      }
      args = this._concatArgs(args);
      if (!isNodeEnv) {
        window._logArgs.push(args);
      }
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
      return this;
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
      var ref1;
      if (!isKind(chunk, Object)) {
        throw TypeError("'chunk' must be an Object");
      }
      if (chunk.length === 0) {
        return false;
      }
      if (chunk.silent !== true) {
        if (isNodeEnv) {
          this._print(chunk.message);
        }
        this.emit("chunk", chunk);
        if (chunk.hidden !== true) {
          this.line.contents += chunk.message;
          this.line.length += chunk.length;
        }
      }
      if (this.isDebug) {
        if ((ref1 = this._chunks) != null) {
          ref1.push(chunk);
        }
      }
      return true;
    },
    _printNewLine: function() {
      var line, ref1;
      if (this.isDebug) {
        if ((ref1 = this._newLines) != null) {
          ref1.push({
            line: this._line,
            lineCount: this.lines.length
          });
        }
      }
      if (this._line === this.lines.length - 1) {
        if (!isNodeEnv) {
          window._contents.push(this.line.contents);
          this._print(this.line.contents);
        }
        this._printToChunk(this.ln, {
          hidden: true
        });
        line = Line(this.lines.length);
        this.lines.push(line);
        return this._line = line.index;
      } else if (!isNodeEnv) {
        throw Error("Changing a Logger's `_line` property is unsupported outside of NodeJS.");
      } else {
        return this._printToChunk(this.ln, {
          silent: true
        });
      }
    },
    _concatArgs: function(args) {
      var addableTypes, result;
      result = "";
      addableTypes = [String, Number, Boolean, Nan, Void];
      sync.each(args, (function(_this) {
        return function(arg) {
          var argType;
          argType = getType(arg);
          if (testKind(argType, Array)) {
            return result += _this._concatArgs(arg);
          } else if (inArray(addableTypes, argType)) {
            return result += arg;
          } else {
            throw TypeError("Unexpected type: " + argType.name);
          }
        };
      })(this));
      return result;
    },
    _logValue: function(value, options) {
      var error, i, isTruncated, line, ref1, valueType;
      try {
        valueType = getType(value);
      } catch (_error) {
        error = _error;
        this.red("" + value);
        return true;
      }
      if (valueType === String) {
        value = stripAnsi(value);
        isTruncated = (options.depth != null) && value.length > options.maxStringLength;
        if (isTruncated) {
          value = value.slice(0, options.maxStringLength);
        }
        this.green("\"");
        ref1 = value.split(this.ln);
        for (i in ref1) {
          line = ref1[i];
          if (Number(i) > 0) {
            this(this.ln);
          }
          this.green(line);
        }
        if (isTruncated) {
          this.cyan("...");
        }
        this.green("\"");
      } else if (valueType === Void) {
        this.yellow.dim("" + value);
      } else if (valueType === Boolean || valueType === Number) {
        this.yellow("" + value);
      } else if (value === Object.empty) {
        this.green.dim("{}");
      } else if (value === Object.prototype) {
        this.green.dim.bold("Object.prototype ");
        this.green.dim("{}");
      } else if (value === Array) {
        this.green.dim.bold("Array ");
        this.green.dim("[]");
      } else if (valueType === Date) {
        this.green.dim.bold("Date ");
        this.green.dim("{ ");
        this.yellow(value.toString());
        this.green.dim(" }");
      } else if (valueType === RegExp) {
        this.green.dim.bold("RegExp ");
        this.green.dim("{ ");
        this.yellow("/" + value.source + "/");
        this.green.dim(" }");
      } else if (isNodeEnv && valueType === Buffer) {
        this.green.dim.bold("Buffer ");
        this.green.dim("{ ");
        this("length");
        this.gray.dim(": ");
        this.yellow(value.length);
        this.green.dim(" }");
      } else {
        return false;
      }
      return true;
    },
    _isLoggableObject: function(obj) {
      return !obj.constructor || !obj.__proto__ || isKind(obj, Object);
    },
    _logObject: function(obj, opts, collapse) {
      var objType, regex;
      if (collapse == null) {
        collapse = false;
      }
      if (!isKind(opts, Object)) {
        throw TypeError("'opts' must be an Object");
      }
      objType = getType(obj);
      if (!this._isLoggableObject(obj)) {
        this.red("Failed to log.");
        return false;
      }
      if (objType != null) {
        if (objType.prototype === obj) {
          this.green.dim.bold(objType.name, ".prototype ");
        } else if (objType === Function) {
          regex = /^function[^\(]*\(([^\)]*)\)/;
          regex.results = regex.exec(obj.toString());
          this.green.dim("function (", regex.results[1], ") ");
        } else {
          this.green.dim.bold(objType.name, " ");
        }
      }
      this.green.dim(objType === Array ? "[" : "{");
      if (collapse || opts.depth > opts.maxObjectDepth) {
        if (Object.keys(obj).length !== 0) {
          this.cyan(" ... ");
        }
      } else {
        opts.objects.push(obj);
        opts.keyPaths.push(opts.keyPath);
        this._logObjectKeys(obj, opts);
      }
      this.green.dim(objType === Array ? "]" : "}");
      return true;
    },
    _logObjectKeys: function(obj, opts) {
      var inheritedKeys, isTruncated, j, key, keyPath, keys, len, maxKeyCount, ref1, showInherited;
      if (!isKind(opts, Object)) {
        throw TypeError("'opts' must be an Object");
      }
      if (!this._isLoggableObject(obj)) {
        this.red("Failed to log.");
        return false;
      }
      keyPath = opts.keyPath;
      keys = KeyMirror(opts.showHidden ? Object.getOwnPropertyNames(obj) : Object.keys(obj));
      inheritedKeys = this._getInheritedKeys(obj, opts);
      if (isKind(obj, Function)) {
        if (obj.name.length > 0) {
          keys._add("name");
        }
      } else if (isKind(obj, Array)) {
        keys._add("length");
      } else if (isKind(obj, Error)) {
        keys._add("code", "message");
      }
      if (isKind(opts.includedKeys, Array)) {
        keys._add(opts.includedKeys);
      }
      if (keys._length === 0 && inheritedKeys.length === 0) {
        return false;
      }
      isTruncated = false;
      maxKeyCount = opts[isKind(obj, Array) ? "maxArrayKeys" : "maxObjectKeys"];
      if (keys._length > maxKeyCount) {
        isTruncated = true;
        keys._replace(keys._keys.slice(opts.keyOffset, opts.keyOffset + maxKeyCount));
      }
      this.indent += 2;
      if (isTruncated && opts.keyOffset > 0) {
        this.moat(0);
        this.cyan("...");
      }
      ref1 = keys._keys;
      for (j = 0, len = ref1.length; j < len; j++) {
        key = ref1[j];
        this._logObjectKey(obj, key, opts);
      }
      if (isTruncated) {
        this.moat(0);
        this.cyan("...");
      }
      if (inheritedKeys.length > 0) {
        this.moat(0);
        this.green.dim.bold("inherited ");
        showInherited = opts.showInherited;
        opts.showInherited = false;
        opts.depth++;
        this._logObject(inheritedKeys.hash, opts);
        opts.depth--;
        opts.showInherited = showInherited;
      }
      this.moat(0);
      this.indent -= 2;
      return true;
    },
    _logObjectKey: function(obj, key, opts) {
      var collapse, error, keyPath, value;
      this.moat(0);
      this.log(key);
      this.green.dim(": ");
      try {
        value = obj[key];
      } catch (_error) {
        error = _error;
        this.red(error.message);
        try {
          throwFailure(error, {
            obj: obj,
            key: key
          });
        } catch (_error) {}
        return;
      }
      if (this._logValue(value, opts)) {
        return;
      }
      if (this._isDuplicateObject(value, opts)) {
        return;
      }
      collapse = opts.collapse;
      if (isKind(collapse, Function)) {
        collapse = collapse(value, key, obj);
      }
      if (!isType(collapse, Boolean)) {
        collapse = false;
      }
      keyPath = opts.keyPath;
      if (keyPath !== "") {
        opts.keyPath += ".";
      }
      opts.keyPath += key;
      opts.depth++;
      this._logObject(value, opts, collapse);
      opts.depth--;
      return opts.keyPath = keyPath;
    },
    _getInheritedKeys: function(obj, opts) {
      var inheritedKeys, key, objProto, objType, value;
      inheritedKeys = [];
      inheritedKeys.hash = {};
      objType = getType(obj);
      objProto = objType != null ? objType.prototype : void 0;
      if (opts.showInherited && opts.keyPath === "" && objProto !== obj) {
        while (true) {
          if (objProto != null) {
            for (key in objProto) {
              value = objProto[key];
              inheritedKeys.push = {
                key: key,
                value: value
              };
              inheritedKeys.hash[key] = value;
            }
          }
          objType = getKind(objType);
          if (objType == null) {
            break;
          }
        }
      }
      return inheritedKeys;
    },
    _debugError: function(error, format) {
      if (format.simple === true) {
        return false;
      }
      if (this.process == null) {
        return false;
      }
      return true;
    },
    _isDuplicateObject: function(obj, opts) {
      var index, keyPath;
      index = opts.objects.indexOf(obj);
      if (index < 0) {
        return;
      }
      keyPath = opts.keyPaths[index];
      if (keyPath.length === 0) {
        return this.cyan("[circular]");
      } else {
        this.cyan("goto(");
        this(opts.keyPath);
        return this.cyan(")");
      }
    }
  });
});

define(Logger, function() {
  this.options = {};
  return this({
    Line: require("./line"),
    mixins: [require("./indent"), require("./flags"), require("./color")]
  });
});

//# sourceMappingURL=../../map/src/logger.map
