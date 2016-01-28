
noop = require "no-op"
define = require "define"

# Can be safely called with any Logger.
module.exports = (log, opts) ->

  verbose = noop
  debug = noop
  spinner = null

  define log, ->

    @options = configurable: no
    @
      isQuiet: no

      isVerbose: didSet: (isVerbose) ->
        verbose = if isVerbose then this else noop

      isDebug: didSet: (isDebug) ->
        debug = if isDebug then this else noop

    @writable = no
    @
      verbose: -> verbose.apply this, arguments

      debug: -> debug.apply this, arguments

  log.isDebug = (opts.debug is yes) or ((global.__DEV__ is yes) and (opts.debug isnt no))
  log.isVerbose = opts.verbose is yes

  if typeof process isnt "undefined"
    log.isDebug = log.isDebug or ("--debug" in process.argv) or (process.env.DEBUG is "true")
    log.isVerbose = log.isVerbose or ("--verbose" in process.argv) or (process.env.VERBOSE is "true")
