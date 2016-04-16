
require "isNodeJS"
require "isDev"

emptyFunction = require "emptyFunction"
define = require "define"

# Can be safely called with any Logger.
module.exports = (log, options) ->

  define log,

    isQuiet: no

    isVerbose: didSet: (isVerbose) ->
      @_verbose = if isVerbose then this else emptyFunction

    isDebug: didSet: (isDebug) ->
      @_debug = if isDebug then this else emptyFunction

    verbose: ->
      @_verbose.apply this, arguments

    debug: ->
      @_debug.apply this, arguments

    _verbose: emptyFunction

    _debug: emptyFunction

  log.isDebug = (options.debug is yes) or (isDev and (options.debug isnt no))
  log.isVerbose = options.verbose is yes

  if isNodeJS
    log.isDebug = log.isDebug or ("--debug" in process.argv) or (process.env.DEBUG is "true")
    log.isVerbose = log.isVerbose or ("--verbose" in process.argv) or (process.env.VERBOSE is "true")
