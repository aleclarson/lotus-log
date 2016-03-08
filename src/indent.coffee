
define = require "define"
hooker = require "hooker"
repeatString = require "repeat-string"

# Can be safely called with any Logger.
module.exports = (log) ->

  hooker.hook log, "_printChunk", (chunk) ->
    return if @line.length > 0 or chunk.message.length is 0 or chunk.message is @ln
    chunk.message = @_indent + chunk.message
    chunk.length += @_indent.length

  define log, ->

    @options = configurable: no
    @ log,

      indent:
        value: 0
        didSet: (newValue, oldValue) ->
          @_indent = repeatString @indentString, newValue

      indentString:
        assign: " "
        didSet: (newValue) ->
          @_indent = repeatString newValue, @indent
          @_indentLength = newValue.length

    @writable = no
    @ log,

      plusIndent: (indent) ->
        @pushIndent indent + @indent

      pushIndent: (indent) ->
        @_indentStack.push @indent
        @indent = indent
        return

      popIndent: (n = 1) ->
        while n-- > 0
          indent = @_indentStack.pop()
          if indent?
            @indent = indent
          else
            @indent = 0
            break
        return

      withIndent: (indent, fn) ->
        @pushIndent indent
        fn()
        @popIndent()
        return

    @options = enumerable: no
    @ log,
      _indent: ""
      _indentLength: 0
      _indentStack: []
