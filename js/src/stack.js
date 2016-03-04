var Finder, Stack, basename, define, dirname, getType, hooker, inArray, isAbsolute, isKind, isType, lotus, ref, ref1, relative, repeatString, sync;

ref = require("path"), dirname = ref.dirname, basename = ref.basename, relative = ref.relative, isAbsolute = ref.isAbsolute;

ref1 = require("type-utils"), getType = ref1.getType, isType = ref1.isType, isKind = ref1.isKind;

repeatString = require("repeat-string");

sync = require("io").sync;

inArray = require("in-array");

Finder = require("finder");

define = require("define");

hooker = require("hooker");

lotus = require("lotus-require");

Stack = null;

module.exports = function(arg) {
  var color, log;
  log = arg.log, color = arg.color;
  if (module.exports.isCalled) {
    throw Error("Shouldn't be called more than once.");
  }
  module.exports.isCalled = true;
  hooker.hook(log, "_debugError", {
    post: function(success, error, options) {
      var stack;
      if (!success || !this.stack.isEnabled) {
        return;
      }
      if (options.stack == null) {
        options.stack = {};
      }
      if (!isKind(options.stack, Object)) {
        return;
      }
      stack = Stack(error, options.stack);
      if (stack == null) {
        return this("Stack was null.");
      }
      return this.stack(stack);
    }
  });
  return define(function() {
    this.options = {
      configurable: false,
      writable: false
    };
    this(log, {
      stack: function(obj, options) {
        var error, frames, promises;
        if (this.isQuiet || !this.stack.isEnabled) {
          return false;
        }
        if (isType(obj, Object) && !arguments.hasOwnProperty(1)) {
          options = obj;
          obj = null;
        }
        if (!isType(options, Object)) {
          options = {};
        }
        if (isKind(obj, Array)) {
          frames = obj;
        } else if (isKind(obj, Stack.Frame)) {
          frames = [obj];
        } else if (isKind(obj, Stack)) {
          frames = obj.frames;
        } else {
          if (isKind(obj, Error)) {
            options.error = obj;
          } else if (obj != null) {
            error = TypeError("'obj' is an invalid type");
            error.format = {
              repl: {
                obj: obj
              }
            };
            throw error;
          }
          frames = Stack(options).frames;
        }
        if (!(isKind(frames, Array)) || frames.length === 0) {
          this.moat(1);
          this.warn("Failed to find any stack frames.");
          this.moat(1);
          return false;
        }
        promises = [];
        sync.each(frames, (function(_this) {
          return function(frame, i) {
            var code, column, filePath, line;
            filePath = frame.getFileName();
            line = frame.getLineNumber();
            column = frame.getColumnNumber() - 1;
            if ((frame.promise != null) && !inArray(promises, frame.promise)) {
              promises.push(frame.promise, true);
              _this.moat(3);
              _this.pink.dim(repeatString("─", 8));
              _this.bold.pink(" From a previous event ");
              _this.pink.dim(repeatString("─", 8));
            }
            _this.moat(1);
            _this.stack._logLocation(line, filePath, frame.getFunctionName());
            if (frame.isEval()) {
              try {
                code = frame.getFunction().toString();
              } catch (_error) {}
            } else if ((filePath != null) && isAbsolute(filePath)) {
              try {
                code = sync.read(filePath);
              } catch (_error) {}
            }
            if (!isType(code, String)) {
              return _this.moat(1);
            }
            code = code.split(log.ln);
            line = code[line - 1];
            if (line == null) {
              return _this.moat(1);
            }
            _this.moat(1);
            _this.stack._logOffender(line, column);
            return _this.moat(1);
          };
        })(this));
        return true;
      }
    });
    this.writable = true;
    this(log.stack, {
      isEnabled: false
    });
    this.enumerable = false;
    return this(log.stack, {
      _logLocation: function(lineNumber, filePath, funcName) {
        var dirName, dirPath;
        log.moat(0);
        log.yellow("" + lineNumber);
        log(repeatString(" ", 5 - ("" + lineNumber).length));
        if (filePath != null) {
          dirName = dirname(filePath);
          dirPath = relative(lotus.path, dirName);
          if (dirName !== ".") {
            log.green.dim(dirPath + "/");
          }
          log.green(basename(filePath));
        }
        if (funcName != null) {
          if (filePath != null) {
            log(" ");
          }
          log.blue.dim("within");
          log(" ");
          log.blue(funcName);
        }
        return log.moat(0);
      },
      _logOffender: function(line, column) {
        var columnIndent, hasOverflow, rawLength;
        rawLength = line.length;
        line = line.replace(/^\s*/, "");
        columnIndent = repeatString(" ", column + line.length - rawLength);
        log.pushIndent(log.indent + 5);
        hasOverflow = (log.process != null) && log.process.stdout.isTTY && log.indent + line.length > log.process.stdout.columns;
        if (hasOverflow) {
          line = line.slice(0, log.process.stdout.columns - log.indent - 4);
        }
        log.moat(0);
        log(line);
        if (hasOverflow) {
          log.gray.dim("...");
        }
        log(log.ln, columnIndent);
        log.red("▲");
        log.moat(0);
        return log.popIndent();
      }
    });
  });
};

//# sourceMappingURL=../../map/src/stack.map
