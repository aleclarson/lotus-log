describe("log.Block()", function() {
  return it("creates a new Block", function() {
    var block;
    block = log.Block();
    return expect(block.constructor).toBe(log.Block);
  });
});

describe("block.append(func)", function() {
  it("adds all messages logged within `func` to the end of `block._contents`", function() {
    var block;
    block = log.Block();
    block.append(function() {
      return log("hello world");
    });
    return expect(block._contents[0]).toBe("hello world");
  });
  return it("prints messages to `block.y`", function() {
    var block;
    block = log.Block();
    block.append(function() {
      return log("hello world");
    });
    return expect(log.lines[block.y].contents).toBe("hello world");
  });
});

describe("block.empty()", function() {
  return it("resets `block._contents` and `block.height`", function() {
    var block;
    block = log.Block();
    block.append(function() {
      return log("hello world");
    });
    block.empty();
    expect(block._contents.length).toBe(0);
    return expect(block.height).toBe(1);
  });
});

//# sourceMappingURL=../../map/spec/block.map
