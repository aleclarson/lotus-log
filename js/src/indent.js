var assertType, define, hooker, repeatString;

assertType = require("type-utils").assertType;

repeatString = require("repeat-string");

hooker = require("hooker");

define = require("define");

module.exports = function(log) {
  hooker.hook(log, "_printChunk", function(chunk) {
    if (this.line.length > 0) {
      return;
    }
    if (chunk.indent === true) {
      chunk.message = this._indent;
      return chunk.length = this._indent.length;
    } else if (!((chunk.length === 0) || (chunk.message === this.ln))) {
      chunk.message = this._indent + chunk.message;
      return chunk.length += this._indent.length;
    }
  });
  return define(log, function() {
    this.options = {
      configurable: false
    };
    this(log, {
      indent: {
        value: 0,
        didSet: function(newValue, oldValue) {
          return this._indent = repeatString(this.indentString, newValue);
        }
      },
      indentString: {
        assign: " ",
        didSet: function(newValue) {
          assertType(newValue, String);
          return this._indent = repeatString(newValue, this.indent);
        }
      }
    });
    this.writable = false;
    this(log, {
      plusIndent: function(indent) {
        return this.pushIndent(indent + this.indent);
      },
      pushIndent: function(indent) {
        this._indentStack.push(this.indent);
        this.indent = indent;
      },
      popIndent: function(n) {
        var indent;
        if (n == null) {
          n = 1;
        }
        while (n-- > 0) {
          indent = this._indentStack.pop();
          if (indent != null) {
            this.indent = indent;
          } else {
            this.indent = 0;
            break;
          }
        }
      },
      withIndent: function(indent, fn) {
        this.pushIndent(indent);
        fn();
        this.popIndent();
      }
    });
    this.options = {
      enumerable: false
    };
    return this(log, {
      _indent: "",
      _indentStack: []
    });
  });
};

//# sourceMappingURL=../../map/src/indent.map
