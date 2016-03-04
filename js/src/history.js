var History, NamedFunction, async, define, dirname, exit, isKind, isType, ref, ref1, sync;

exit = require("exit");

define = require("define");

dirname = require("path").dirname;

ref = require("io"), sync = ref.sync, async = ref.async;

ref1 = require("type-utils"), isType = ref1.isType, isKind = ref1.isKind;

NamedFunction = require("named-function");

module.exports = function(log) {
  return define(function() {
    var history, withHistory;
    history = History({
      enabled: false
    });
    withHistory = function(history, action) {
      var _history;
      if (!((history == null) || history instanceof History)) {
        throw TypeError("'history' must be a History type, but was instead a " + history.constructor.name + " type.");
      }
      _history = this.history;
      this.history = history;
      action();
      this.history = _history;
      return null;
    };
    this.options = {
      configurable: false
    };
    this(log, {
      history: history
    });
    this.writable = false;
    this(log, {
      History: History,
      withHistory: withHistory
    });
    return log.on("chunk", function(chunk) {
      if (log.history != null) {
        return log.history.push(chunk.message);
      }
    });
  });
};

History = NamedFunction("History", function(options) {
  var cache;
  if (!isKind(this, History)) {
    return new History(options);
  }
  if (options == null) {
    options = {};
  }
  cache = options.cache || [];
  return define(this, function() {
    this.options = {};
    this({
      enabled: options.enabled || true,
      cache: {
        assign: cache,
        willSet: function(cache) {
          var count;
          count = cache.length;
          if (count > this.limit) {
            count = this.limit;
            cache = cache.slice(count - this.limit, count);
          }
          this.count = count;
          return cache;
        }
      },
      count: cache.length,
      limit: options.limit || 100,
      transform: options.transform,
      file: {
        assign: options.file,
        didSet: function(newPath, oldPath) {
          var contents;
          if (isType(oldPath, String)) {
            this._work = this._work.then(function() {
              return async.remove(oldPath);
            });
          }
          if (isType(newPath, String)) {
            exit.off(this._exit);
            exit.on(this._exit = (function(_this) {
              return function() {
                try {
                  return sync.write(newPath, _this.cache.join("¶"));
                } catch (_error) {}
              };
            })(this));
            if (sync.exists(newPath)) {
              contents = sync.read(newPath);
              return this.cache = contents.split("¶");
            } else {
              return this._work = this._work.then(function() {
                return async.makeDir(dirname(newPath));
              }).then(function() {
                return async.write(newPath, "");
              });
            }
          }
        }
      }
    });
    this.enumerable = false;
    return this({
      _work: async.fulfill(),
      _exit: null
    });
  });
});

define(function() {
  this.options = {
    configurable: false,
    writable: false
  };
  return this(History.prototype, {
    push: function(data) {
      if (!this.enabled) {
        return this.count;
      }
      if (this.transform instanceof Function) {
        data = this.transform(data);
      }
      if ((data == null) || data === false) {
        return this.count;
      }
      if (this.count === this.limit) {
        this.cache.shift();
      }
      this.cache.push(data);
      if (this.count !== this.limit) {
        this.count++;
      }
      return this.count;
    }
  });
});

//# sourceMappingURL=../../map/src/history.map
