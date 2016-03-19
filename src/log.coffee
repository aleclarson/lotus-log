
require "lotus-require"

{ isKind } = require "type-utils"

isNodeJS = require "isNodeJS"
define = require "define"

Logger = require "./logger"
Line = require "./line"

getLogOptions = ->
  opts =
    mixins: [
      require "./stack"
      require "./cursor"
    ]
  if isNodeJS
    opts.process = process
  else
    opts.print = (message) ->
      console.log message
  opts

log = module.exports = Logger getLogOptions()

# Allow 'promise.fail log.error'.
log.error = log.error.bind log
# log.error.isQuiet = no
# log.error.isPretty = yes

window.log = log unless isNodeJS

# Replace bare-bones logger with the lotus-log.
require("temp-log")._ = log

# setupExitHandler = ->
#   exit = require "exit"
#   exit?.on (code) -> log.onExit code
#
#   inUncaughtException = no
#   handleError = (error) ->
#     return if inUncaughtException
#     inUncaughtException = yes
#     log.onError error
#     inUncaughtException = no
#
#   if isNodeJS
#     process.on "uncaughtException", handleError
#   else
#     window.onerror = handleError
#
# setupExitHandler()

define ->

  @options =
    configurable: no
    writable: no

  @ Logger,

    log: log

  @ log,

    Logger: Logger

  # @writable = yes
  #
  # @ log,
  #
  #   onExit: (code) ->
  #     @indent = 0
  #     @moat 1
  #     @cursor.isHidden = no
  #     process.exit code
  #
  #   onError: (error, format) ->
  #     @moat 1
  #     @error error, format
