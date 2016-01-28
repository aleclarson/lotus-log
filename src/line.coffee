
define = require "define"
NamedFunction = require "named-function"

Line = module.exports = NamedFunction "Line", (options) ->
  return new Line options unless this instanceof Line
  if typeof options is "number"
    @index = options
    @contents = ""
    @length = 0
  else
    @index = options.index
    @contents = options.contents ? ""
    @length = @contents.length
  this
