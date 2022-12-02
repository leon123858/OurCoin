/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

"use strict";

// const assert = require("bsert");
const { Sandbox } = require("../lib/sandbox/sandbox");

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
    const newSandbox = new Sandbox(id);
    await newSandbox.initSandbox();
    await newSandbox.deploy(`var state = JSON.parse(ORIGIN_STATE);
    if (action == 'create') {
      if (typeof state['NFT'] == 'undefined') state['NFT'] = [];
      state['NFT'].push({ url: url, title: title });
    }
    //print(state)
    saveState(JSON.stringify(state))
    `);
    await newSandbox.closeSandbox();
  });
  it("should call contract in it", async () => {
    const params = {
      action: "create",
      url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
      title: "測試圖片",
    };
    const newSandbox = new Sandbox(id);
    await newSandbox.initSandbox();
    await newSandbox.execute(params);
    await newSandbox.execute(params);
    await newSandbox.execute(params);
    await newSandbox.closeSandbox();
  });
});
