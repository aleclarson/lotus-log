
require "isNodeJS"

{ Void
  Null
  Nan
  isType
  assertType } = require "type-utils"

repeatString = require "repeat-string"
childProcess = require "child_process"
stripAnsi = require "strip-ansi"
KeyMirror = require "keymirror"
inArray = require "in-array"
Factory = require "factory"
Event = require "event"
sync = require "sync"

concatArgs = require "./concatArgs"
Formatter = require "./Formatter"
Line = require "./Line"

if isNodeJS then defaultNewline = (require "os").EOL
else defaultNewline = "\n"

mixins = [
  require "./mixins/indent"
  require "./mixins/flags"
  require "./mixins/color"
]

module.exports =
Logger = Factory "Logger",

  statics: { Line, mixins }

  kind: Function

  customValues:

    size: get: ->
      return null unless @process and @process.stdout and @process.stdout.isTTY
      @process.stdout.getWindowSize()

    line: get: ->
      @lines[@_line]

    _line:
      didSet: (newValue) ->
        return if @lines[newValue]?
        throw Error "Bad line number: #{newValue}"

  initValues: (options) ->

    ln: defaultNewline

    lines: [ new Line 0 ]

    format: null

    didPrint: Event()

    _print: options.print

  init: (options) ->

    if !options.process and !options.print
      throw Error "Must provide 'options.process' or 'options.print'!"

    @_line = 0

    if isNodeJS and options.process
      @process = options.process
      if @process.stdout
        @_print = (message) =>
          @process.stdout.write message

    mixins = options.mixins or []
    mixins = mixins.concat Logger.mixins
    sync.each mixins, (mixin) =>
      return unless mixin
      mixin this, options

    @format = Formatter this

  func: ->
    args = [] # Must not leak arguments object!
    args[index] = value for value, index in arguments
    @_log args
    return

  it: ->
    @moat 0
    @apply null, arguments
    @moat 0
    return

  ansi: (code) ->
    return unless isNodeJS
    @_print "\x1b[#{code}"
    return

  moat: (width) ->

    assertType width, Number

    # Calculate the required newlines to match the specified moat width.
    _width = @_computeMoatFrom @_line

    # Print the required newlines.
    @_printNewLine() while _width++ < width

    return

  origin: (id) ->
    @moat 1
    @pink.dim "[" + (new Date).toLocaleTimeString() + "]"
    @ " "
    @pink.bold id
    @moat 0

  withLabel: (label, message) ->
    @moat 1
    @ label
    @ ": "
    @ message
    @moat 1
    return

  clear: ->
    return unless isNodeJS
    if @process
      @cursor._x = @cursor._y = 0
      @_print childProcess.execSync "printf '\\33c\\e[3J'", encoding: "utf8"
    @_line = 0
    @lines = [new Line 0]
    return

  clearLine: (line) ->

    return unless isNodeJS

    line = @lines[line or @_line]

    unless line?
      throw Error "Missing line: #{line}"

    if @process

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
    return

  deleteLine: ->
    @lines.pop()
    if @process
      @ansi "2K"
      @cursor.y--
    else
      @_line--
    return

  _log: (args) ->
    return no if @isQuiet
    args = concatArgs args
    lines = args.split @ln
    return no if lines.length is 0
    lastLine = lines.pop()
    sync.each lines, (line) =>
      @_printToChunk line
      @_printNewLine()
    @_printToChunk lastLine
    return yes

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

      @didPrint.emit chunk

      # Newlines are marked as `hidden` so they're not added to the `line.contents`.
      if chunk.hidden isnt yes
        line = @line
        @line.contents += chunk.message
        @line.length += chunk.length

    return yes

  _printNewLine: ->

    # Push a new Line onto `log.lines` if currently on the last line.
    if @_line is @lines.length - 1

      # Outside of NodeJS, messages are buffered because `console.log` must be used.
      @_print @line.contents unless isNodeJS

      @_printToChunk @ln, hidden: yes

      line = Line @lines.length
      @lines.push line
      @_line = line.index

    else unless isNodeJS
      throw Error "Changing a Logger's `_line` property is unsupported outside of NodeJS."

    # Since line splicing is not yet supported, just move the cursor down and overwrite existing lines.
    else
      @_printToChunk @ln, silent: yes

  _debugError: (error, format) ->

    # Simple errors don't bother to print the stack trace or start the REPL. That would be overkill.
    return no if format.simple is yes

    # Stack trace support and REPL support is only for Loggers with a 'process' property.
    return no unless @process?

    return yes
