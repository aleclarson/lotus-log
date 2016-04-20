
{ resolve } = require "path"

Factory = require "factory"
sync = require "sync"
hook = require "hook"

# Should only be called on default Logger!
module.exports = (log) ->

  log.cursor = Cursor log

  hook.after log, "_printChunk", (result, chunk) ->
    if chunk.message is @ln then @cursor._x = 0
    else @cursor._x += chunk.length

exports.Cursor =
Cursor = Factory "Cursor",

  customValues:

    position: get: ->
      { @x, @y }

    x:
      get: -> @_x
      set: (newValue, oldValue) ->
        newValue = Math.max 0, Math.min @_log.size[0], newValue
        return if newValue is oldValue
        if newValue > oldValue then @_right newValue - oldValue
        else @_left oldValue - newValue
        @_x = newValue

    y:
      get: -> @_y
      set: (newValue, oldValue) ->
        newValue = Math.max 0, Math.min @_log.lines.length, newValue
        return if newValue is oldValue
        if newValue > oldValue then @_down newValue - oldValue
        else @_up oldValue - newValue
        @_y = newValue

    isHidden:
      value: yes
      assign: no
      didSet: (newValue, oldValue) ->
        return if newValue is oldValue
        @_log.ansi "?25" + if newValue then "l" else "h"

    _y:
      get: -> @_log._line
      set: (newValue) -> @_log._line = newValue

  initValues: (log) ->

    _log: log

    _x: 0

    _savedPositions: []

    _restoredPositions: []

  move: ({ x, y }) ->
    @y = y if y?
    @x = x if x?
    return

  save: ->
    @_savedPositions.push @position
    return

  restore: ->
    position = @_savedPositions.pop()
    @_restoredPositions.push position
    @move position
    return

  scrollUp: (n = 1) ->
    # TODO: Fix this.
    # script = sync.read resolve __dirname + "/../../scripts/scroll-up.applescript"
    # script = script.replace /'/g, "\\'"
    # execSync "osascript -e '#{script}' #{process.pid}", encoding: "utf8"

  scrollDown: (n = 1) ->
    # TODO: Fix this.
    # @_log.ansi "#{n}T" if n > 0
    # return

  _up: (n = 1) -> @_log.ansi "#{n}F"

  _down: (n = 1) -> @_log.ansi "#{n}E"

  _left: (n = 1) -> @_log.ansi "#{n}D"

  _right: (n = 1) -> @_log.ansi "#{n}C"
