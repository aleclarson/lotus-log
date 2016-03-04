var Line, NamedFunction, define;

define = require("define");

NamedFunction = require("named-function");

Line = module.exports = NamedFunction("Line", function(options) {
  var ref;
  if (!(this instanceof Line)) {
    return new Line(options);
  }
  if (typeof options === "number") {
    this.index = options;
    this.contents = "";
    this.length = 0;
  } else {
    this.index = options.index;
    this.contents = (ref = options.contents) != null ? ref : "";
    this.length = this.contents.length;
  }
  return this;
});

//# sourceMappingURL=../../map/src/line.map
