
{ isType, setType, Shape } = require "type-utils"

isNodeJS = require "isNodeJS"
LazyVar = require "lazy-var"
combine = require "combine"

TextStyle = require "../TextStyle"

# Can be safely called with any Logger.
module.exports = (log, options) ->

  log.color = {}

  palette = options.palette or combine {}, defaultPalette
  log.palette = palette

  log.isColorful = options.colorful isnt no

  if log.process and log.isColorful
    log.isColorful = log.process.stdout.isTTY

  shouldAddColors = ->
    return no if not isNodeJS
    return no if log.isQuiet
    return log.isColorful

  # log.red(...) prints the result
  print = (messages) -> log._log messages

  TextStyle.defineCreators log, { palette, print, shouldAddColors }

  # log.color.red(...) returns the result
  print = (messages) -> messages.join ""

  TextStyle.defineCreators log.color, { palette, print, shouldAddColors }

defaultPalette =

  bright:
    red: [4, 0, 0]
    blue: [0, 1, 5]
    green: [0, 5, 1]
    cyan: [0, 3, 4]
    white: [5, 5, 5]
    gray: [2, 2, 2]
    yellow: [5, 5, 0]
    pink: [5, 0, 4]
    black: [0, 0, 0]

  dim:
    red: [2, 0, 0]
    blue: [0, 0, 2]
    green: [0, 2, 1]
    cyan: [0, 1, 2]
    white: [3, 3, 3]
    gray: [1, 1, 1]
    yellow: [2, 2, 0]
    pink: [3, 0, 1]
    black: [0, 0, 0]
