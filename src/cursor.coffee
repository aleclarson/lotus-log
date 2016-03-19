
#
# Debuggable properties:
#
#   log.cursor._restoredPositions = []
#
#     This will track positions that were set using `log.cursor.restore()`. Set to `null` to stop tracking.
#
#   log.cursor._setPositions = []
#
#     This will track all position sets. Set to `null` to stop tracking.
#
#   log.cursor._savedPositions
#
#     No need to set this one. It is already used as a cache by `log.cursor.save()`. You can inspect this, but you probably shouldn't touch it.
#

{ sync } = require "io"
define = require "define"
hooker = require "hooker"
{ resolve } = require "path"

# Should only be called on default Logger!
module.exports = (log) ->

  define log, ->
    @options = configurable: no, writable: no
    @ cursor: value: {}
    @ log.cursor, ->
      @
        move: ({ x, y }) ->
          @y = y if y?
          @x = x if x?
          return

        save: ->
          @_savedPositions.push @position
          return

        restore: ->
          position = @_savedPositions.pop()
          @_restoredPositions?.push position
          @move position
          return

        scrollUp: (n = 1) ->
          # script = sync.read resolve __dirname + "/../../scripts/scroll-up.applescript"
          # script = script.replace /'/g, "\\'"
          # execSync "osascript -e '#{script}' #{process.pid}", encoding: "utf8"

        scrollDown: (n = 1) ->
          # log.ansi "#{n}T" if n > 0
          # return

      @writable = yes
      @
        position:
          get: -> x: @_x, y: @_y

        x:
          get: -> @_x
          set: (newValue, oldValue) ->
            newValue = Math.max 0, Math.min log.size[0], newValue
            return if newValue is oldValue
            if newValue > oldValue then @_right newValue - oldValue
            else @_left oldValue - newValue
            @_x = newValue

        y:
          get: -> @_y
          set: (newValue, oldValue) ->
            newValue = Math.max 0, Math.min log.lines.length, newValue
            return if newValue is oldValue
            if newValue > oldValue then @_down newValue - oldValue
            else @_up oldValue - newValue
            @_y = newValue

        isHidden:
          value: yes
          assign: no
          didSet: (newValue, oldValue) ->
            return if newValue is oldValue
            log.ansi "?25" + if newValue then "l" else "h"

      @enumerable = no
      @
        _x:
          value: 0
          didSet: (x) ->
            @_setPositions?.push { x } if log.isDebug

        _y:
          get: -> log._line
          set: (newValue) -> log._line = newValue
          didSet: (y) ->
            @_setPositions?.push { y } if log.isDebug

        _savedPositions: []

      @writable = no
      @
        _up: (n = 1) -> log.ansi "#{n}F"

        _down: (n = 1) -> log.ansi "#{n}E"

        _left: (n = 1) -> log.ansi "#{n}D"

        _right: (n = 1) -> log.ansi "#{n}C"

  hooker.hook log, "_printChunk", post: (result, chunk) ->
    if chunk.message is @ln then @cursor._x = 0
    else @cursor._x += chunk.length

  null
