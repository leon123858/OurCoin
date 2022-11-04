/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

"use strict";

// const assert = require("bsert");
const sandbox = require("../lib/sandbox");

function randomHash(bit) {
  bit = bit || 64;
  const chars = "abcdef1234567890";
  const len = 16;
  let str = "";
  for (let i = 0; i < bit; i++)
    str += chars.charAt(Math.floor(Math.random() * len));
  return str;
}

describe("Sandbox", function () {
  let id;
  before(async () => {
    id = randomHash();
  });
  it("should deploy contract in it", async () => {
    const newSandbox = new sandbox.sandbox(id);
    await newSandbox.initSandbox();
    await newSandbox.deploy(`var state = JSON.parse(ORIGIN_STATE);
    state.number = state.number ? state.number + 1 : 1;
    if(typeof message !== 'undefined')
      state['message'] = message;
    saveState(state);`);
    await newSandbox.closeSandbox();
  });
  it("should call contract in it", async () => {
    const newSandbox = new sandbox.sandbox(id);
    await newSandbox.initSandbox();
    await newSandbox.execute({});
    await newSandbox.execute({ message: "" });
    await newSandbox.execute({ message: "Hello Contract!" });
    await newSandbox.closeSandbox();
  });
});
