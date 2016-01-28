
# TODO: Allow simultaneous use of foreground & background color.

{ setType, setKind } = require "type-utils"
NamedFunction = require "named-function"
capitalize = require "capitalize"
isNodeEnv = require "is-node-env"
stripAnsi = require "strip-ansi"
{ sync } = require "io"
define = require "define"
hooker = require "hooker"
ansi = require "ansi-256-colors"

# Can be safely called with any Logger.
module.exports = (log, opts) ->

  palettes = log.color.palettes if log.color instanceof Object
  palettes ?= module.exports.defaultPalettes
  colors = Object.keys palettes.bright

  hooker.hook log, "_printChunk", (chunk) ->
    message = stripAnsi chunk.message
    chunk.message = message unless @isColorful
    chunk.length = message.length

  define log, ->
    @options = {}
    defineStyleAttributes colors, (key, value) ->
      finalize = (messages) -> log.apply log, messages
      style = Style { log, colors, finalize }
      style[key] = value
      style

    @configurable = no
    @
      isColorful: value: opts.colorful or yes
      color: value: { palettes }

  define log.color, ->
    @options = {}
    defineStyleAttributes colors, (key, value) ->
      finalize = (messages) -> messages.join ""
      style = Style { log, colors, finalize }
      style[key] = value
      style

  null

defaultPalettes =

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

Style = NamedFunction "Style", ({ log, finalize, colors }) ->

  palettes = log.color.palettes

  style = (messages...) ->

    return finalize messages if !isNodeEnv or log.isQuiet or !log.isColorful

    palette = style.palette ? if style.isDim then "dim" else "bright"

    colors = palettes[palette]

    if style.isBold
      messages.unshift "\x1b[1m"
      messages.push "\x1b[22m"

    if style.fg?
      messages.unshift ansi.fg.getRgb.apply null, colors[style.fg]

    if style.bg?
      messages.unshift ansi.bg.getRgb.apply null, colors[style.bg]

    if style.fg? or style.bg?
      messages.push ansi.reset

    finalize messages

  setType style, Style

  define style, ->
    @options = null
    @
      fg: null
      bg: null
      palette: null
      isBold: no
      isDim: no

    defineStyleAttributes colors, (key, value) ->
      style[key] = value
      style

define ->
  @options = configurable: no
  @ module.exports, defaultPalettes: value: defaultPalettes
  @writable = no
  @ module.exports, { Style }

setKind Style, Function

defineStyleAttributes = (colors, setAttribute) ->
  sync.each colors, (color) ->
    define color, get: -> setAttribute "fg", color
    define "bg" + capitalize(color), get: -> setAttribute "bg", color
  define
    dim: get: -> setAttribute "isDim", yes
    bold: get: -> setAttribute "isBold", yes
