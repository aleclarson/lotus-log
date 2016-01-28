
describe "log.Block()", ->

  it "creates a new Block", ->
    block = log.Block()
    expect(block.constructor).toBe log.Block

describe "block.append(func)", ->

  it "adds all messages logged within `func` to the end of `block._contents`", ->
    block = log.Block()
    block.append -> log "hello world"
    expect(block._contents[0]).toBe "hello world"

  it "prints messages to `block.y`", ->
    block = log.Block()
    block.append -> log "hello world"
    expect(log.lines[block.y].contents).toBe "hello world"

describe "block.empty()", -> 

  it "resets `block._contents` and `block.height`", ->
    block = log.Block()
    block.append -> log "hello world"
    block.empty()
    expect(block._contents.length).toBe 0
    expect(block.height).toBe 1
