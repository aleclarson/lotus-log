#
# # TODO: Set the saved messages as keys on an object literal so we can sense duplicates.
#
# exit = require "exit"
# define = require "define"
# { dirname } = require "path"
# { sync, async } = require "io"
# { isType, isKind } = require "type-utils"
# NamedFunction = require "NamedFunction"
#
# # Can be safely called with any Logger.
# module.exports = (log) -> define ->
#
#   history = History enabled: no
#
#   withHistory = (history, action) ->
#     unless !history? or history instanceof History
#       throw TypeError "'history' must be a History type, but was instead a #{history.constructor.name} type."
#     _history = @history
#     @history = history
#     action()
#     @history = _history
#     null
#
#   @options = configurable: no
#   @ log, { history }
#
#   @writable = no
#   @ log, { History, withHistory }
#
#   log.on "chunk", (chunk) ->
#     log.history.push chunk.message if log.history?
#
# History = NamedFunction "History", (options) ->
#
#   if !isKind this, History
#     return new History options
#
#   options ?= {}
#
#   cache = options.cache or []
#
#   define this, ->
#     @options = {}
#     @
#       enabled: options.enabled or yes
#
#       cache:
#         assign: cache
#         willSet: (cache) ->
#           count = cache.length
#           if count > @limit
#             count = @limit
#             cache = cache.slice count - @limit, count
#           @count = count
#           cache
#
#       count: cache.length
#
#       limit: options.limit or 100
#
#       transform: options.transform
#
#       file:
#         assign: options.file
#         didSet: (newPath, oldPath) ->
#
#           if isType oldPath, String
#
#             @_work = @_work.then ->
#               async.remove oldPath
#
#           if isType newPath, String
#
#             exit.off @_exit
#
#             exit.on @_exit = =>
#               try sync.write newPath, @cache.join "¶"
#
#             if sync.exists newPath
#
#               contents = sync.read newPath
#
#               @cache = contents.split "¶"
#
#             else
#
#               @_work = @_work.then ->
#                 async.makeDir dirname newPath
#
#               .then ->
#                 async.write newPath, ""
#
#     @enumerable = no
#     @
#       _work: async.fulfill()
#       _exit: null
#
# define ->
#
#   @options = configurable: no, writable: no
#
#   @ History.prototype,
#
#     push: (data) ->
#       return @count if !@enabled
#       data = @transform data if @transform instanceof Function
#       return @count if !data? or data is no
#       @cache.shift() if @count is @limit
#       @cache.push data
#       @count++ if @count isnt @limit
#       @count
