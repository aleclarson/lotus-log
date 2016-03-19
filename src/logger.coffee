
{ isType, getType, setType, isKind, testKind, getKind
  setKind, assertType, assertKind, Void, Null, Nan } = require "type-utils"

{ throwFailure } = require "failure"
{ sync } = require "io"

NamedFunction = require "named-function"
repeatString = require "repeat-string"
childProcess = require "child_process"
EventEmitter = require "eventemitter3"
stripAnsi = require "strip-ansi"
KeyMirror = require "keymirror"
isNodeJS = require "isNodeJS"
inArray = require "in-array"
define = require "define"
has = require "has"
OS = require "os"

Line = require "./line"

Logger = module.exports = NamedFunction "Logger", (options) ->

  options = {} unless isKind options, Object

  if options.process?.stdout?
    options.colorful ?= options.process.stdout.isTTY
    options.print = (message, encoding) ->
      options.process.stdout.write message, encoding

  if !options.print?
    throw Error "either 'options.print' or 'options.process' must exist"

  log = (args...) -> log._log args

  setType log, Logger

  define log, ->

    @options = {}
    @
      log: log

      ln: OS?.EOL or "\n"

      line: get: -> @lines[@_line]

      lines: [new Line 0]

      process: options.process

    @mirror new EventEmitter

    @options = {}
    @

    @enumerable = no
    @
      _line:
        assign: 0
        didSet: (newValue) ->
          return if @lines[newValue]?
          @error.isPretty = no
          throw Error "Bad line number: #{newValue}"

      _print: options.print

  mixins = options.mixins.concat(Logger.mixins)

  sync.each mixins, (mixin) ->
    mixin? log, options

  log

setKind Logger, Function

unless isNodeJS
  window._logArgs = []
  window._contents = []

define Logger.prototype, ->

  @options = {}
  @
    it: (args...) ->
      @moat 0
      @_log args
      @moat 0

    format: (value, opts = {}) ->
      opts = label: opts if isType opts, String
      assertType opts, Object
      @moat 0
      @log opts.label if opts.label?
      if opts.unlimited
        opts.maxObjectDepth = Infinity
        opts.maxObjectKeys = Infinity
        opts.maxArrayKeys = Infinity
        opts.maxStringLength = Infinity
      else
        opts.maxStringLength ?= @format.maxStringLength
      unless @_logValue value, opts
        opts.depth = 0
        opts.keyPath = ""
        opts.keyPaths = []
        opts.objects = []
        opts.keyOffset ?= @format.keyOffset
        opts.showInherited ?= @format.showInherited
        unless opts.unlimited
          opts.maxObjectDepth ?= @format.maxObjectDepth
          opts.maxObjectKeys ?= @format.maxObjectKeys
          opts.maxArrayKeys ?= @format.maxArrayKeys
        @_logObject value, opts
      @moat 0
      @

    ansi: (code) ->
      @_print "\x1b[#{code}" if isNodeJS

    moat: (width) ->

      assertType width, Number

      # Calculate the required newlines to match the specified moat width.
      _width = @_computeMoatFrom @_line

      # Debugging info.
      @_moats?.push { width, _width, _line: @_line } if @isDebug

      # Print the required newlines.
      @_printNewLine() while _width++ < width

      @

    origin: (id) ->
      @moat 1
      @pink.dim "[" + (new Date).toLocaleTimeString() + "]"
      @ " "
      @pink.bold id
      @moat 0

    error: (error, format) ->

      if @error.isQuiet
        return no

      unless isNodeJS
        # This method only exists in a React Native environment.
        console.reportException? error if console.reportErrorsAsExceptions is yes
        return

      unless format?
        if isKind error.format, Function then format = error.format()
        else if isKind error.format, Object then format = error.format
        else format = {}

      if !@error.isPretty or format?.isPretty is no
        @moat 1
        @log error.stack
        @moat 1
        @process?.exit 0 unless format.exit is no
        return this

      # TODO: Print the help...
      # if isType error.help, String
      #   error.help = (-> @).bind(error.help)

      if !isKind error, Error
        if !has(arguments, 1) and isType error, Object
          format = error
          error = Error "No error message provided."
        else
          throw TypeError "'error' must be an Error"

      @pushIndent @indent + 2

      label = @color.bgRed error.constructor.name

      @withLabel label, error.message

      @_debugError error, format

      @popIndent()

      @process?.exit 0 unless format.exit is no

      @

    warn: (message) ->
      label = @color.yellow.bold "Warning"
      @withLabel label, message
      @emit "warn", message
      return yes

    withLabel: (label, message) ->
      @moat 1
      @ label
      @ ": "
      @ message
      @moat 1
      @

    noPrint: value: {}

    size: get: ->
      @process.stdout.getWindowSize() if @process? and @process.stdout.isTTY

    clear: ->
      return unless isNodeJS
      if @process?
        @cursor._x = @cursor._y = 0
        @_print childProcess.execSync "printf '\\33c\\e[3J'", encoding: "utf8"
      @_line = 0
      @lines = [new Line 0]
      @emit "clear"
      @

    clearLine: (line) ->

      line = @lines[line or @_line]

      if !line?
        throw Error "Missing line: #{line}"

      if @process?

        isCurrentLine = line.index is @_line

        if isCurrentLine
          @cursor.x = 0

        else
          @cursor.save()
          @cursor.move x: 0, y: line.index

        message = repeatString " ", line.length
        @_printToChunk message, { line: line.index, hidden: yes }

        if isCurrentLine
          @cursor.x = 0

        else
          @cursor.restore()

      line.contents = ""
      line.length = 0

      @

    deleteLine: ->
      @lines.pop()
      if @process?
        @ansi "2K"
        @cursor.y--
      else
        @_line--
      @

  @ Logger::format,

    maxObjectDepth: 2

    maxObjectKeys: 30

    maxArrayKeys: 10

    maxStringLength: 60

    keyOffset: 0

    showInherited: no

  @ Logger::error,

    isPretty: no # yes

    isQuiet: no

  @enumerable = no
  @
    # The logger called as a function.
    _log: (args) ->
      return no if @isQuiet
      args = @_concatArgs args
      window._logArgs.push args unless isNodeJS
      lines = args.split @ln
      return no if lines.length is 0
      lastLine = lines.pop()
      sync.each lines, (line) =>
        @_printToChunk line
        @_printNewLine()
      @_printToChunk lastLine
      @

    # Calculates the number of new-lines to print before a moat is full.
    _computeMoatFrom: (line) ->
      width = -1
      loop
        if @lines[line].length is 0
          width++
        else
          break
        if line-- is 0
          break
      width # If this equals -1, the current line has a length greater than zero.

    _printToChunk: (message, chunk = {}) ->
      chunk.message = message
      chunk.line ?= @_line
      chunk.length ?= stripAnsi(chunk.message).length
      @_printChunk chunk

    _printChunk: (chunk) ->

      assertType chunk, Object
      assertType chunk.message, String
      assertType chunk.length, Number

      return no if chunk.length is 0

      if chunk.silent isnt yes

        # Outside of NodeJS, messages are buffered because `console.log` must be used.
        @_print chunk.message if isNodeJS

        @emit "chunk", chunk

        # Newlines are marked as `hidden` so they're not added to the `line.contents`.
        if chunk.hidden isnt yes
          @line.contents += chunk.message
          @line.length += chunk.length

      # Debugging info.
      @_chunks?.push chunk if @isDebug

      yes

    _printNewLine: ->

      # Debugging info.
      @_newLines?.push { line: @_line, lineCount: @lines.length } if @isDebug

      # Push a new Line onto `log.lines` if currently on the last line.
      if @_line is @lines.length - 1

        # Outside of NodeJS, messages are buffered because `console.log` must be used.
        unless isNodeJS
          window._contents.push @line.contents
          @_print @line.contents

        @_printToChunk @ln, hidden: yes

        line = Line @lines.length
        @lines.push line
        @_line = line.index

      else unless isNodeJS
        throw Error "Changing a Logger's `_line` property is unsupported outside of NodeJS."

      # Since line splicing is not yet supported, just move the cursor down and overwrite existing lines.
      else
        @_printToChunk @ln, silent: yes

    # Transforms an array of arguments into a single string.
    _concatArgs: (args) ->
      result = ""
      addableTypes = [ String, Number, Boolean, Nan, Void ]
      sync.each args, (arg) =>
        argType = getType arg
        if testKind argType, Array
          result += @_concatArgs arg
        else if inArray addableTypes, argType
          result += arg
        else
          throw TypeError "Unexpected type: #{argType.name}"
      result

    _logValue: (value, options) ->

      valueType = getType value

      if valueType is String
        value = stripAnsi value
        isTruncated = options.depth? and value.length > options.maxStringLength
        value = value.slice 0, options.maxStringLength if isTruncated
        @green "\""
        for i, line of value.split @ln
          @ @ln if Number(i) > 0
          @green line
        @cyan "..." if isTruncated
        @green "\""

      else if valueType is Void or valueType is Null
        @yellow.dim "#{value}"

      else if valueType is Boolean or valueType is Number
        @yellow "#{value}"

      else if valueType is Nan
        @red "NaN"

      else if value is Object.empty
        @green.dim "{}"

      else if value is Object.prototype
        @green.dim.bold "Object.prototype "
        @green.dim "{}"

      else if value is Array
        @green.dim.bold "Array "
        @green.dim "[]"

      else if valueType is Date
        @green.dim.bold "Date "
        @green.dim "{ "
        @yellow value.toString()
        @green.dim " }"

      else if valueType is RegExp
        @green.dim.bold "RegExp "
        @green.dim "{ "
        @yellow "/#{value.source}/"
        @green.dim " }"

      else if isNodeJS and valueType is Buffer
        @green.dim.bold "Buffer "
        @green.dim "{ "
        @ "length"
        @gray.dim ": "
        @yellow value.length
        @green.dim " }"

      else
        return no

      yes

    _isLoggableObject: (obj) ->
      return no unless obj
      return yes unless obj.constructor
      return yes unless obj.__proto__
      return isKind obj, Object

    _logObject: (obj, opts, collapse = no) ->

      assertKind opts, Object

      objType = getType obj

      unless @_isLoggableObject obj
        @red "Failed to log."
        return no

      if objType?
        if obj is objType.prototype
          @green.dim.bold objType.name + ".prototype " if objType.name
        else if objType is Function
          regex = /^function\s*([^\(]*)\(([^\)]*)\)/
          regex.results = regex.exec obj.toString()
          @green.dim "function " + regex.results[1] + "(" + regex.results[2] + ") "
        else
          @green.dim.bold objType.name, " "

      @green.dim if objType is Array then "[" else "{"

      if collapse or opts.depth > opts.maxObjectDepth
        @cyan " ... " if Object.keys(obj).length isnt 0
      else
        opts.objects.push obj
        opts.keyPaths.push opts.keyPath
        @_logObjectKeys obj, opts

      @green.dim if objType is Array then "]" else "}"

      yes

    _logObjectKeys: (obj, opts) ->

      assertKind opts, Object

      unless @_isLoggableObject obj
        @red "Failed to log."
        return no

      isRoot = opts.keyPath is ""

      if isRoot and opts.showHidden
        keys = KeyMirror Object.getOwnPropertyNames obj
        keys._remove "prototype", "constructor"
      else keys = KeyMirror Object.keys obj

      if isRoot and opts.showInherited
        inherited = @_getInheritedValues obj

      hasInheritedValues = inherited and inherited.count

      if isKind obj, Array
        keys._add "length"

      else if isKind obj, Error
        keys._add "code", "message"

      if isKind opts.includedKeys, Array
        keys._add opts.includedKeys

      if keys._length is 0
        return no unless hasInheritedValues

      isTruncated = no

      maxKeyCount = opts[if isKind(obj, Array) then "maxArrayKeys" else "maxObjectKeys"]

      if keys._length > maxKeyCount
        isTruncated = yes
        keys._replace keys._keys.slice opts.keyOffset, opts.keyOffset + maxKeyCount

      @plusIndent 2

      if isTruncated and opts.keyOffset > 0
        @moat 0
        @cyan "..."

      for key in keys._keys
        @_logObjectKey obj, key, opts

      if isTruncated
        @moat 0
        @cyan "..."

      if hasInheritedValues
        @moat 0
        @_logInheritedValues inherited.values, opts

      @moat 0
      @popIndent()

      yes

    _logObjectKey: (obj, key, opts) ->

      @moat 0
      @log key
      @green.dim ": "

      try value = obj[key]
      catch error
        @red error.message
        try throwFailure error, { obj, key }
        return

      return if @_logValue value, opts

      return if @_isDuplicateObject value, opts

      { collapse } = opts

      # Call 'collapse' as a filter if it's a Function.
      if isKind collapse, Function then collapse = collapse value, key, obj

      # Ensure 'collapse' is a Boolean.
      collapse = no unless isType collapse, Boolean

      { keyPath } = opts

      opts.keyPath += "." unless keyPath is ""

      opts.keyPath += key

      opts.depth++

      @_logObject value, opts, collapse

      opts.depth--

      opts.keyPath = keyPath

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

    _logInheritedValues: (values, opts) ->
      @green.dim.bold "inherited "
      { showInherited, keyOffset } = opts
      opts.showInherited = no
      opts.keyOffset = 0
      opts.depth++
      @_logObject values, opts
      opts.depth--
      opts.keyOffset = keyOffset
      opts.showInherited = showInherited

    _debugError: (error, format) ->

      # Simple errors don't bother to print the stack trace or start the REPL. That would be overkill.
      return no if format.simple is yes

      # Stack trace support and REPL support is only for Loggers with a 'process' property.
      return no unless @process?

      yes

    _isDuplicateObject: (obj, opts) ->

      index = opts.objects.indexOf obj

      return if index < 0

      keyPath = opts.keyPaths[index]

      if keyPath.length is 0
        @cyan "[circular]"

      else
        @cyan "goto("
        @ opts.keyPath
        @cyan ")"

define Logger, ->

  @options = {}
  @
    Line: require "./line"

    mixins: [
      require "./indent"
      require "./flags"
      require "./color"
      # require "./history"
    ]
