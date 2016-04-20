
{ Null, Nan, isType } = require "type-utils"

sync = require "sync"

AddableType = [ String, Number, Boolean, Nan, Null ]

# Transforms an array of arguments into a single string.
module.exports =
concatArgs = (args) ->
  result = ""
  sync.each args, (arg) =>
    return if arg is undefined
    if Array.isArray arg
      result += concatArgs arg
    else if isType arg, AddableType
      result += arg
    return
  return result
