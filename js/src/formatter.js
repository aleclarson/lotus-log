var Factory, KeyMirror, Nan, Null, Void, assertType, getType, isNodeJS, isType, ref, repeatString, stripAnsi;

ref = require("type-utils"), Void = ref.Void, Null = ref.Null, Nan = ref.Nan, isType = ref.isType, getType = ref.getType, assertType = ref.assertType;

repeatString = require("repeat-string");

stripAnsi = require("strip-ansi");

KeyMirror = require("keymirror");

isNodeJS = require("isNodeJS");

Factory = require("factory");

module.exports = Factory("Formatter", {
  kind: Function,
  initValues: function(log) {
    return {
      maxObjectDepth: 2,
      maxObjectKeys: 30,
      maxArrayKeys: 10,
      maxStringLength: 60,
      showInherited: false,
      _log: log
    };
  },
  func: function(obj, options) {
    var parts, result, value;
    if (options == null) {
      options = {};
    }
    if (isType(options, String)) {
      options = {
        label: options
      };
    }
    assertType(options, Object);
    parts = [];
    if (options.label) {
      parts.push(options.label);
    }
    if (options.isColorful == null) {
      options.isColorful = this._log.isColorful;
    }
    if (options.maxStringLength == null) {
      options.maxStringLength = options.unlimited ? Infinity : this.maxStringLength;
    }
    value = this._formatValue(obj, options);
    if (value) {
      parts = parts.concat(value);
    } else {
      options.depth = 0;
      options.keyPath = "";
      options.keyPaths = [];
      options.objects = [];
      if (options.showInherited == null) {
        options.showInherited = this.showInherited;
      }
      if (options.maxObjectDepth == null) {
        options.maxObjectDepth = options.unlimited ? Infinity : this.maxObjectDepth;
      }
      if (options.maxObjectKeys == null) {
        options.maxObjectKeys = options.unlimited ? Infinity : this.maxObjectKeys;
      }
      if (options.maxArrayKeys == null) {
        options.maxArrayKeys = options.unlimited ? Infinity : this.maxArrayKeys;
      }
      parts.push(this._formatObject(obj, options));
    }
    result = this._log._concatArgs(parts);
    if (!options.isColorful) {
      result = stripAnsi(result);
    }
    if (options.print === false) {
      return result;
    }
    this._log.moat(0);
    this._log(result);
    this._log.moat(0);
  },
  configure: function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      this[key] = value;
    }
  },
  _formatValue: function(value, options) {
    var color, i, isTruncated, j, len, line, ln, parts, ref1, ref2, valueType;
    ref1 = this._log, color = ref1.color, ln = ref1.ln;
    valueType = getType(value);
    if (valueType === String) {
      value = stripAnsi(value);
      isTruncated = (options.depth != null) && value.length > options.maxStringLength;
      if (isTruncated) {
        value = value.slice(0, options.maxStringLength);
      }
      parts = [];
      parts.push(color.green("\""));
      ref2 = value.split(ln);
      for (i = j = 0, len = ref2.length; j < len; i = ++j) {
        line = ref2[i];
        if (i > 0) {
          parts.push(ln);
        }
        parts.push(color.green(line));
      }
      if (isTruncated) {
        parts.push(color.cyan("..."));
      }
      parts.push(color.green("\""));
      return parts;
    }
    if (valueType === Void || valueType === Null) {
      return color.yellow.dim("" + value);
    }
    if (valueType === Boolean || valueType === Number) {
      return color.yellow("" + value);
    }
    if (valueType === Nan) {
      return color.red.dim("NaN");
    }
    if (value === Object.empty) {
      return color.green.dim("{}");
    }
    if (value === Object.prototype) {
      return [color.green.dim.bold("Object.prototype "), color.green.dim("{}")];
    }
    if (value === Array) {
      return [color.green.dim.bold("Array "), color.green.dim("[]")];
    }
    if (valueType === Date) {
      return [color.green.dim.bold("Date "), color.green.dim("{ "), color.yellow(value.toString()), color.green.dim(" }")];
    }
    if (valueType === RegExp) {
      return [color.green.dim.bold("RegExp "), color.green.dim("{ "), color.yellow("/" + value.source + "/"), color.green.dim(" }")];
    }
    if (isNodeJS && valueType === Buffer) {
      return [color.green.dim.bold("Buffer "), color.green.dim("{ "), color.white("length"), color.gray.dim(": "), color.yellow(value.length), color.green.dim(" }")];
    }
  },
  _isLoggableObject: function(obj) {
    if (!obj) {
      return false;
    }
    if (!obj.constructor) {
      return true;
    }
    if (!obj.__proto__) {
      return true;
    }
    return isType(obj, Object.Kind);
  },
  _formatObject: function(obj, options, collapse) {
    var color, objType, parts, regex;
    if (collapse == null) {
      collapse = false;
    }
    assertType(options, Object);
    color = this._log.color;
    objType = getType(obj);
    if (!this._isLoggableObject(obj)) {
      return color.red("Failed to log.");
    }
    parts = [];
    if (objType) {
      if (obj === objType.prototype) {
        if (objType.name) {
          parts.push(color.green.dim.bold(objType.name + ".prototype "));
        }
      } else if (objType === Function) {
        regex = /^function\s*([^\(]*)\(([^\)]*)\)/;
        regex.results = regex.exec(obj.toString());
        parts.push(color.green.dim("function " + regex.results[1] + "(" + regex.results[2] + ") "));
      } else {
        parts.push(color.green.dim.bold(objType.name, " "));
      }
    }
    parts.push(color.green.dim(objType === Array ? "[" : "{"));
    if (collapse || options.depth > options.maxObjectDepth) {
      if (Object.keys(obj).length !== 0) {
        parts.push(color.cyan(" ... "));
      }
    } else {
      parts = parts.concat(this._formatObjectKeys(obj, options));
    }
    parts.push(color.green.dim(objType === Array ? "]" : "}"));
    return parts;
  },
  _formatObjectKeys: function(obj, options) {
    var color, hasInheritedValues, indent, inherited, isRoot, isTruncated, j, key, keys, len, ln, maxKeyCount, parts, ref1, ref2;
    assertType(options, Object);
    ref1 = this._log, color = ref1.color, ln = ref1.ln;
    if (!this._isLoggableObject(obj)) {
      return color.red("Failed to log.");
    }
    isRoot = options.keyPath === "";
    if (isRoot && options.showHidden) {
      keys = KeyMirror(Object.getOwnPropertyNames(obj));
      keys._remove("prototype", "constructor");
    } else {
      keys = KeyMirror(Object.keys(obj));
    }
    if (isRoot && options.showInherited) {
      inherited = this._getInheritedValues(obj);
    }
    hasInheritedValues = inherited && inherited.count;
    if (isType(obj, Array)) {
      keys._add("length");
    } else if (isType(obj, Error.Kind)) {
      keys._add("code", "message");
    }
    if (isType(options.includedKeys, Array)) {
      keys._add(options.includedKeys);
    }
    if (keys._length === 0) {
      if (!hasInheritedValues) {
        return;
      }
    }
    isTruncated = false;
    maxKeyCount = options[isType(obj, Array) ? "maxArrayKeys" : "maxObjectKeys"];
    if (keys._length > maxKeyCount) {
      isTruncated = true;
    }
    options.objects.push(obj);
    options.keyPaths.push(options.keyPath);
    parts = [];
    ref2 = keys._keys;
    for (j = 0, len = ref2.length; j < len; j++) {
      key = ref2[j];
      parts = parts.concat(this._formatObjectKey(obj, key, options));
    }
    if (isTruncated) {
      parts.push(ln);
      parts.push(color.cyan("..."));
    }
    if (hasInheritedValues) {
      parts.push(ln);
      parts = parts.concat(this._formatInheritedValues(inherited.values, options));
    }
    indent = "  ";
    parts = parts.join("").split(ln).map(function(line) {
      return indent + line + ln;
    });
    return parts;
  },
  _formatObjectKey: function(obj, key, options) {
    var collapse, color, error, index, keyPath, ln, parts, ref1, value, valueParts;
    ref1 = this._log, ln = ref1.ln, color = ref1.color;
    parts = [ln, key, color.green.dim(": ")];
    try {
      value = obj[key];
    } catch (_error) {
      error = _error;
      parts.push(color.red(error.message));
      return parts;
    }
    valueParts = this._formatValue(value, options);
    if (valueParts) {
      parts = parts.concat(valueParts);
      return parts;
    }
    index = options.objects.indexOf(value);
    if (index >= 0) {
      keyPath = options.keyPaths[index];
      if (keyPath.length === 0) {
        parts.push(color.gray.dim("[circular]"));
      } else {
        parts = parts.concat([color.gray.dim("goto("), color.white(options.keyPath), color.gray.dim(")")]);
      }
      return;
    }
    collapse = options.collapse, keyPath = options.keyPath;
    if (isType(collapse, Function.Kind)) {
      collapse = collapse(value, key, obj);
    }
    if (!isType(collapse, Boolean)) {
      collapse = false;
    }
    if (keyPath !== "") {
      options.keyPath += ".";
    }
    options.keyPath += key;
    options.depth++;
    parts = parts.concat(this._formatObject(value, options, collapse));
    options.depth--;
    options.keyPath = keyPath;
    return parts;
  },
  _getInheritedValues: function(obj) {
    var count, j, key, len, objProto, objType, ref1, values;
    if (!obj) {
      return;
    }
    objType = getType(obj);
    if (!objType) {
      return;
    }
    count = 0;
    values = Object.create(null);
    while (true) {
      objProto = objType.prototype;
      if (objProto != null) {
        ref1 = Object.getOwnPropertyNames(objProto);
        for (j = 0, len = ref1.length; j < len; j++) {
          key = ref1[j];
          if (key === "constructor") {
            continue;
          }
          if (key === "__proto__") {
            continue;
          }
          if (has(values, key)) {
            continue;
          }
          if (has(obj, key)) {
            continue;
          }
          values[key] = objProto[key];
          count += 1;
        }
      }
      objType = getKind(objType);
      if (!objType) {
        break;
      }
    }
    return {
      count: count,
      values: values
    };
  },
  _formatInheritedValues: function(values, options) {
    var color, parts, showInherited;
    color = this._log.color;
    parts = [color.green.dim.bold("inherited ")];
    showInherited = options.showInherited;
    options.showInherited = false;
    options.depth++;
    parts = parts.concat(this._formatObject(values, options));
    options.depth--;
    options.showInherited = showInherited;
    return parts;
  }
});

//# sourceMappingURL=../../map/src/formatter.map
