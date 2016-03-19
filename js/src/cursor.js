var define, hooker, resolve, sync;

sync = require("io").sync;

define = require("define");

hooker = require("hooker");

resolve = require("path").resolve;

module.exports = function(log) {
  define(log, function() {
    this.options = {
      configurable: false,
      writable: false
    };
    this({
      cursor: {
        value: {}
      }
    });
    return this(log.cursor, function() {
      this({
        move: function(arg) {
          var x, y;
          x = arg.x, y = arg.y;
          if (y != null) {
            this.y = y;
          }
          if (x != null) {
            this.x = x;
          }
        },
        save: function() {
          this._savedPositions.push(this.position);
        },
        restore: function() {
          var position, ref;
          position = this._savedPositions.pop();
          if ((ref = this._restoredPositions) != null) {
            ref.push(position);
          }
          this.move(position);
        },
        scrollUp: function(n) {
          if (n == null) {
            n = 1;
          }
        },
        scrollDown: function(n) {
          if (n == null) {
            n = 1;
          }
        }
      });
      this.writable = true;
      this({
        position: {
          get: function() {
            return {
              x: this._x,
              y: this._y
            };
          }
        },
        x: {
          get: function() {
            return this._x;
          },
          set: function(newValue, oldValue) {
            newValue = Math.max(0, Math.min(log.size[0], newValue));
            if (newValue === oldValue) {
              return;
            }
            if (newValue > oldValue) {
              this._right(newValue - oldValue);
            } else {
              this._left(oldValue - newValue);
            }
            return this._x = newValue;
          }
        },
        y: {
          get: function() {
            return this._y;
          },
          set: function(newValue, oldValue) {
            newValue = Math.max(0, Math.min(log.lines.length, newValue));
            if (newValue === oldValue) {
              return;
            }
            if (newValue > oldValue) {
              this._down(newValue - oldValue);
            } else {
              this._up(oldValue - newValue);
            }
            return this._y = newValue;
          }
        },
        isHidden: {
          value: true,
          assign: false,
          didSet: function(newValue, oldValue) {
            if (newValue === oldValue) {
              return;
            }
            return log.ansi("?25" + (newValue ? "l" : "h"));
          }
        }
      });
      this.enumerable = false;
      this({
        _x: {
          value: 0,
          didSet: function(x) {
            var ref;
            if (log.isDebug) {
              return (ref = this._setPositions) != null ? ref.push({
                x: x
              }) : void 0;
            }
          }
        },
        _y: {
          get: function() {
            return log._line;
          },
          set: function(newValue) {
            return log._line = newValue;
          },
          didSet: function(y) {
            var ref;
            if (log.isDebug) {
              return (ref = this._setPositions) != null ? ref.push({
                y: y
              }) : void 0;
            }
          }
        },
        _savedPositions: []
      });
      this.writable = false;
      return this({
        _up: function(n) {
          if (n == null) {
            n = 1;
          }
          return log.ansi(n + "F");
        },
        _down: function(n) {
          if (n == null) {
            n = 1;
          }
          return log.ansi(n + "E");
        },
        _left: function(n) {
          if (n == null) {
            n = 1;
          }
          return log.ansi(n + "D");
        },
        _right: function(n) {
          if (n == null) {
            n = 1;
          }
          return log.ansi(n + "C");
        }
      });
    });
  });
  hooker.hook(log, "_printChunk", {
    post: function(result, chunk) {
      if (chunk.message === this.ln) {
        return this.cursor._x = 0;
      } else {
        return this.cursor._x += chunk.length;
      }
    }
  });
  return null;
};

//# sourceMappingURL=../../map/src/cursor.map
