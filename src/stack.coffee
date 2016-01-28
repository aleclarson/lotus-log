
{ dirname, basename, relative, isAbsolute } = require "path"
{ getType, isType, isKind } = require "type-utils"
repeatString = require "repeat-string"
{ sync } = require "io"
inArray = require "in-array"
Finder = require "finder"
define = require "define"
hooker = require "hooker"
lotus = require "lotus-require"

Stack = null # require "stack"

# Should only be called on the default Logger.
module.exports = ({ log, color }) ->

  throw Error "Shouldn't be called more than once." if module.exports.isCalled
  module.exports.isCalled = yes

  hooker.hook log, "_debugError", post: (success, error, options) ->
    return if !success or !@stack.isEnabled
    options.stack ?= {}
    return unless isKind options.stack, Object
    stack = Stack error, options.stack
    return @ "Stack was null." if !stack?
    @stack stack

  define ->

    @options = configurable: no, writable: no

    @ log, stack: (obj, options) ->

      return no if @isQuiet or !@stack.isEnabled

      # Use the first argument as 'options' if it's an Object
      if isType(obj, Object) and !arguments.hasOwnProperty 1
        options = obj
        obj = null

      # Ensure 'options' is an Object
      if !isType options, Object
        options = {}

      # Handle 'obj' as an array of stack frames
      if isKind obj, Array
        frames = obj

      # Handle 'obj' as a singular stack frame
      else if isKind obj, Stack.Frame
        frames = [obj]

      # Handle 'obj' as the raw output from Stack()
      else if isKind obj, Stack
        frames = obj.frames

      # Handle 'obj' as an error or undefined
      else

        if isKind obj, Error
          options.error = obj

        else if obj?
          error = TypeError "'obj' is an invalid type"
          error.format = repl: { obj }
          throw error

        frames = Stack(options).frames

      if !(isKind frames, Array) or frames.length is 0
        @moat 1
        @warn "Failed to find any stack frames."
        @moat 1
        return no

      # Detect the first time every promise is found in `frame.promise`
      promises = []

      sync.each frames, (frame, i) =>

        filePath = frame.getFileName()
        line = frame.getLineNumber()
        column = frame.getColumnNumber() - 1

        if frame.promise? and !inArray promises, frame.promise
          promises.push frame.promise, yes
          @moat 3
          @pink.dim repeatString "─", 8
          @bold.pink " From a previous event "
          @pink.dim repeatString "─", 8

        @moat 1
        @stack._logLocation line, filePath, frame.getFunctionName()

        if frame.isEval()
          try code = frame.getFunction().toString()

        else if filePath? and isAbsolute filePath
          try code = sync.read filePath

        return @moat 1 unless isType code, String

        code = code.split log.ln
        line = code[line - 1]

        # Line number may not be accurate for code executed via 'eval'.
        return @moat 1 unless line?

        @moat 1
        @stack._logOffender line, column
        @moat 1

      yes

    @writable = yes

    @ log.stack, isEnabled: no # yes

    @enumerable = no

    @ log.stack,

      _logLocation: (lineNumber, filePath, funcName) ->

        log.moat 0

        log.yellow "#{lineNumber}"
        log repeatString " ", 5 - "#{lineNumber}".length

        if filePath?
          dirName = dirname filePath
          dirPath = relative lotus.path, dirName
          log.green.dim dirPath + "/" if dirName isnt "."
          log.green basename filePath

        if funcName?
          log " " if filePath?
          log.blue.dim "within"
          log " "
          log.blue funcName

        log.moat 0

      _logOffender: (line, column) ->

        rawLength = line.length

        # Remove spaces from the beginning of the offending line of code.
        line = line.replace /^\s*/, ""

        # Calculate the position of the ▲ icon.
        columnIndent = repeatString " ", column + line.length - rawLength

        log.pushIndent log.indent + 5

        hasOverflow = log.process? and
                      log.process.stdout.isTTY and
                      log.indent + line.length > log.process.stdout.columns

        if hasOverflow
          line = line.slice 0, log.process.stdout.columns - log.indent - 4

        log.moat 0
        log line
        log.gray.dim "..." if hasOverflow
        log log.ln, columnIndent
        log.red "▲"
        log.moat 0
        log.popIndent()
