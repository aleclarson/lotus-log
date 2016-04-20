
{ assertType } = require "type-utils"

repeatString = require "repeat-string"
define = require "define"
hook = require "hook"

# Can be safely called with any Logger.
module.exports = (log) ->

  hook.before log, "_printChunk", (chunk) ->
    return if @line.length > 0
    if chunk.indent is yes
      chunk.message = @_indent
      chunk.length = @_indent.length
    else unless (chunk.length is 0) or (chunk.message is @ln)
      chunk.message = @_indent + chunk.message
      chunk.length += @_indent.length

  define log,

    _indent: ""

    _indentStack: []

    indent:
      value: 0
      didSet: (newValue, oldValue) ->
        @_indent = repeatString @indentString, newValue

    indentString:
      value: " "
      didSet: (newValue) ->
        assertType newValue, String
        @_indent = repeatString newValue, @indent

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
