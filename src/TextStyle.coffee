
{ Shape } = require "type-utils"

Factory = require "factory"
define = require "define"
ansi = require "ansi-256-colors"
sync = require "sync"

concatArgs = require "./concatArgs"

Palette = Shape "Palette", { bright: Object, dim: Object }

module.exports =
TextStyle = Factory "TextStyle",

  statics:

    defineCreators: (target, options) ->
      colors = Object.keys options.palette.bright
      TextStyle.defineAttributes target, colors, (key, value) ->
        style = TextStyle options
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
    palette: Palette
    print: Function
    shouldAddColors: Function

  initValues: (options) ->
    palette: options.palette
    print: options.print
    shouldAddColors: options.shouldAddColors

  init: ->
    colors = Object.keys @palette.bright
    TextStyle.defineAttributes this, colors, (key, value) =>
      this[key] = value
      this

  func: ->
    args = [] # Must not leak arguments object!
    args[index] = value for value, index in arguments

    unless @shouldAddColors()
      return @print args

    colors = @palette[if @isDim then "dim" else "bright"]

    lines = concatArgs(args).split "\n"

    for line in lines

      if @isBold
        args.unshift "\x1b[1m"
        args.push "\x1b[22m"

      if @fg and colors[@fg]
        args.unshift ansi.fg.getRgb.apply null, colors[@fg]
        args.push ansi.reset

    return @print args
