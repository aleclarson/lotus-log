var define, hooker, repeatString;

define = require("define");

hooker = require("hooker");

repeatString = require("repeat-string");

module.exports = function(log) {
  hooker.hook(log, "_printChunk", function(chunk) {
    if (this.line.length > 0 || chunk.message.length === 0 || chunk.message === this.ln) {
      return;
    }
    chunk.message = this._indent + chunk.message;
    return chunk.length += this._indent.length;
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
          this._indent = repeatString(newValue, this.indent);
          return this._indentLength = newValue.length;
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
      _indentLength: 0,
      _indentStack: []
    });
  });
};

//# sourceMappingURL=../../map/src/indent.map
