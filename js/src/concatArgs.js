var AddableType, Nan, Null, concatArgs, isType, ref, sync;

ref = require("type-utils"), Null = ref.Null, Nan = ref.Nan, isType = ref.isType;

sync = require("sync");

AddableType = [String, Number, Boolean, Nan, Null];

module.exports = concatArgs = function(args) {
  var result;
  result = "";
  sync.each(args, (function(_this) {
    return function(arg) {
      if (arg === void 0) {
        return;
      }
      if (Array.isArray(arg)) {
        result += concatArgs(arg);
      } else if (isType(arg, AddableType)) {
        result += arg;
      }
    };
  })(this));
  return result;
};

//# sourceMappingURL=../../map/src/concatArgs.map
