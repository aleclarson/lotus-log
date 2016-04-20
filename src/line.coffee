
{ isType } = require "type-utils"

Factory = require "factory"

module.exports = Factory "Line",

  initArguments: (arg) ->
    arg = { index: arg } if isType arg, Number
    [ arg ]

  optionTypes:
    index: Number
    contents: String

  optionDefaults:
    contents: ""

  initValues: (options) ->

    index: options.index

    contents: options.contents

    length: options.contents.length
