
# TODO: Allow simultaneous use of foreground & background color.

{ setType, Shape } = require "type-utils"

NamedFunction = require "named-function"
isNodeJS = require "isNodeJS"
Factory = require "factory"
define = require "define"
ansi = require "ansi-256-colors"
sync = require "sync"

# Can be safely called with any Logger.
module.exports = (log, options) ->

  log.isColorful = options.colorful isnt no

  if log.process and log.isColorful
    log.isColorful = log.process.stdout.isTTY

  palettes = options.palettes or exports.defaultPalettes

  log.color = {}
  TextStyle.defineCreators log.color, palettes, (messages) -> messages.join ""

  TextStyle.defineCreators log, palettes, (messages) -> log._log messages

exports.defaultPalettes =

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

exports.TextStyle =
TextStyle = Factory "TextStyle",

  statics:

    defineCreators: (target, palettes, print) ->
      colors = Object.keys palettes.bright
      TextStyle.defineAttributes target, colors, (key, value) ->
        style = TextStyle { palettes, print }
        style[key] = value
        style

    defineAttributes: (target, colors, setAttribute) ->
      attributes = sync.reduce colors, {}, (attributes, key) ->
        attributes[key] = get: -> setAttribute "fg", key
        attributes
      attributes.dim = get: -> setAttribute "isDim", yes
      attributes.bold = get: -> setAttribute "isBold", yes
      define target, attributes

  kind: Function

  optionTypes:
    palettes: Shape { bright: Object, dim: Object }
    print: Function

  initValues: (options) ->
    palettes: options.palettes
    print: options.print

  init: ->
    colors = Object.keys @palettes.bright
    TextStyle.defineAttributes this, colors, (key, value) =>
      this[key] = value
      this

  func: ->
    args = [] # Must not leak arguments object!
    args[index] = value for value, index in arguments

    if not isNodeJS or log.isQuiet or not log.isColorful
      return @print args

    colors = @palettes[if @isDim then "dim" else "bright"]

    if @isBold
      args.unshift "\x1b[1m"
      args.push "\x1b[22m"

    if @fg and colors[@fg]
      args.unshift ansi.fg.getRgb.apply null, colors[@fg]
      args.push ansi.reset

    return @print args
