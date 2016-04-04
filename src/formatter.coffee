
{ Void
  Null
  Nan
  isType
  getType
  assertType } = require "type-utils"

repeatString = require "repeat-string"
stripAnsi = require "strip-ansi"
KeyMirror = require "keymirror"
isNodeJS = require "isNodeJS"
Factory = require "factory"

concatArgs = require "./concatArgs"

module.exports = Factory "Formatter",

  kind: Function

  initValues: (log) ->

    maxObjectDepth: 2

    maxObjectKeys: 30

    maxArrayKeys: 10

    maxStringLength: 60

    showInherited: no

    _log: log

  func: (obj, options = {}) ->

    if isType options, String
      options = { label: options }

    assertType options, Object

    parts = []

    if options.label
      parts.push options.label

    options.isColorful ?= @_log.isColorful
    options.maxStringLength ?= if options.unlimited then Infinity else @maxStringLength

    value = @_formatValue obj, options

    if value
      parts = parts.concat value

    else
      options.depth = 0
      options.keyPath = ""
      options.keyPaths = []
      options.objects = []
      options.showInherited ?= @showInherited
      options.maxObjectDepth ?= if options.unlimited then Infinity else @maxObjectDepth
      options.maxObjectKeys ?= if options.unlimited then Infinity else @maxObjectKeys
      options.maxArrayKeys ?= if options.unlimited then Infinity else @maxArrayKeys
      parts.push @_formatObject obj, options

    result = concatArgs parts

    unless options.isColorful
      result = stripAnsi result

    if options.print is no
      return result

    @_log.moat 0
    @_log result
    @_log.moat 0
    return

  configure: (options) ->
    for key, value of options
      this[key] = value
    return

  _formatValue: (value, options) ->

    { color, ln } = @_log

    valueType = getType value

    if valueType is String
      value = stripAnsi value
      isTruncated = options.depth? and value.length > options.maxStringLength
      value = value.slice 0, options.maxStringLength if isTruncated
      parts = []
      parts.push color.green "\""
      for line, i in value.split ln
        parts.push ln if i > 0
        parts.push color.green line
      parts.push color.cyan "..." if isTruncated
      parts.push color.green "\""
      return parts

    if valueType is Void or valueType is Null
      return color.yellow.dim "#{value}"

    if valueType is Boolean or valueType is Number
      return color.yellow "#{value}"

    if valueType is Nan
      return color.red.dim "NaN"

    if value is Object.empty
      return color.green.dim "{}"

    if value is Object.prototype
      return [
        color.green.dim.bold "Object.prototype "
        color.green.dim      "{}"
      ]

    if value is Array
      return [
        color.green.dim.bold "Array "
        color.green.dim      "[]"
      ]

    if valueType is Date
      return [
        color.green.dim.bold "Date "
        color.green.dim      "{ "
        color.yellow         value.toString()
        color.green.dim      " }"
      ]

    if valueType is RegExp
      return [
        color.green.dim.bold "RegExp "
        color.green.dim      "{ "
        color.yellow         "/#{value.source}/"
        color.green.dim      " }"
      ]

    if isNodeJS and valueType is Buffer
      return [
        color.green.dim.bold "Buffer "
        color.green.dim      "{ "
        color.white          "length"
        color.gray.dim       ": "
        color.yellow         value.length
        color.green.dim      " }"
      ]

    return

  _isLoggableObject: (obj) ->
    return no unless obj
    return yes unless obj.constructor
    return yes unless obj.__proto__
    return isType obj, Object.Kind

  _formatObject: (obj, options, collapse = no) ->

    assertType options, Object

    { color } = @_log

    objType = getType obj

    unless @_isLoggableObject obj
      return color.red "Failed to log."

    parts = []

    if objType
      if obj is objType.prototype
        parts.push color.green.dim.bold objType.name + ".prototype " if objType.name
      else if objType is Function
        regex = /^function\s*([^\(]*)\(([^\)]*)\)/
        regex.results = regex.exec obj.toString()
        parts.push color.green.dim "function " + regex.results[1] + "(" + regex.results[2] + ") "
      else
        parts.push color.green.dim.bold objType.name, " "

    parts.push color.green.dim if objType is Array then "[" else "{"

    if collapse or options.depth > options.maxObjectDepth
      parts.push color.cyan " ... " if Object.keys(obj).length isnt 0
    else
      parts = parts.concat @_formatObjectKeys obj, options

    parts.push color.green.dim if objType is Array then "]" else "}"

    return parts

  _formatObjectKeys: (obj, options) ->

    assertType options, Object

    { color, ln } = @_log

    unless @_isLoggableObject obj
      return color.red "Failed to log."

    isRoot = options.keyPath is ""

    if isRoot and options.showHidden
      keys = KeyMirror Object.getOwnPropertyNames obj
      keys._remove "prototype", "constructor"
    else keys = KeyMirror Object.keys obj

    if isRoot and options.showInherited
      inherited = @_getInheritedValues obj

    hasInheritedValues = inherited and inherited.count

    if isType obj, Array
      keys._add "length"

    else if isType obj, Error.Kind
      keys._add "code", "message"

    if isType options.includedKeys, Array
      keys._add options.includedKeys

    if keys._length is 0
      return unless hasInheritedValues

    isTruncated = no

    maxKeyCount = options[if isType(obj, Array) then "maxArrayKeys" else "maxObjectKeys"]

    if keys._length > maxKeyCount
      isTruncated = yes

    options.objects.push obj
    options.keyPaths.push options.keyPath

    parts = []

    for key in keys._keys
      parts = parts.concat @_formatObjectKey obj, key, options

    if isTruncated
      parts.push ln
      parts.push color.cyan "..."

    if hasInheritedValues
      parts.push ln
      parts = parts.concat @_formatInheritedValues inherited.values, options

    indent = "  "
    parts = parts
      .join ""
      .split ln
      .map (line) ->
        indent + line + ln

    return parts

  _formatObjectKey: (obj, key, options) ->

    { ln, color } = @_log

    parts = [
      ln
      key
      color.green.dim ": "
    ]

    try value = obj[key]
    catch error
      parts.push color.red error.message
      return parts

    valueParts = @_formatValue value, options

    if valueParts
      parts = parts.concat valueParts
      return parts

    index = options.objects.indexOf value
    if index >= 0
      keyPath = options.keyPaths[index]
      if keyPath.length is 0
        parts.push color.gray.dim "[circular]"
      else
        parts = parts.concat [
          color.gray.dim "goto("
          color.white options.keyPath
          color.gray.dim ")"
        ]
      return

    { collapse, keyPath } = options

    collapse = collapse value, key, obj if isType collapse, Function.Kind
    collapse = no unless isType collapse, Boolean

    options.keyPath += "." unless keyPath is ""
    options.keyPath += key
    options.depth++

    parts = parts.concat @_formatObject value, options, collapse

    options.depth--
    options.keyPath = keyPath

    return parts

  _getInheritedValues: (obj) ->

    return unless obj
    objType = getType obj
    return unless objType

    count = 0
    values = Object.create null

    loop
      objProto = objType.prototype
      if objProto?
        for key in Object.getOwnPropertyNames objProto
          continue if key is "constructor"
          continue if key is "__proto__"
          continue if has values, key
          continue if has obj, key
          values[key] = objProto[key]
          count += 1

      objType = getKind objType
      break unless objType

    { count, values }

  _formatInheritedValues: (values, options) ->

    { color } = @_log
    parts = [
      color.green.dim.bold "inherited "
    ]

    { showInherited } = options
    options.showInherited = no
    options.depth++

    parts = parts.concat @_formatObject values, options

    options.depth--
    options.showInherited = showInherited

    return parts
