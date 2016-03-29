
require "lotus-require"

isNodeJS = require "isNodeJS"

options = {}

options.mixins = [
  require "./cursor"
]

if isNodeJS
  options.process = process

else
  # InteractionManager = require "InteractionManager"
  # messageQueue = []
  # messageQueue.isFlushing = no
  # messageQueue.flush = ->
  #   return if @isFlushing
  #   return unless @length
  #   @isFlushing = yes
  #   InteractionManager.runAfterInteractions =>
  #     console.log @shift()
  #     @isFlushing = no
  #     @flush()
  #     return
  options.print = (message) ->
    console.log message
    # messageQueue.push message
    # messageQueue.flush()

Logger = require "./logger"

module.exports =
log = Logger options

log.Logger = Logger

# Replace bare-bones logger with the lotus-log.
require("temp-log")._ = log
