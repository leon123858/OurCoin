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
    await newSandbox.deploy(`
    if (!state.NFT) state.NFT = [];
    if (args.action == 'create') {
      state['NFT'].push({ url: args.url, title: args.title });
    }
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
  it("should call other contract in contract", async () => {
    const newId = randomHash();
    const newSandbox = new Sandbox(newId);
    await newSandbox.initSandbox();
    await newSandbox.deploy(`
      await execTransaction(args.id,${JSON.stringify({
        action: "create",
        url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
        title: "contract call",
      })})`);
    await newSandbox.closeSandbox();
    const newSandbox2 = new Sandbox(newId);
    await newSandbox2.initSandbox();
    await newSandbox2.execute({ id });
    await newSandbox2.closeSandbox();
  });
  xit("should be shutdown when contract call too long(use recursive to test it)", async () => {
    // vm2 can not resolve this problem now
    const newId = randomHash();
    const newSandbox = new Sandbox(newId);
    await newSandbox.initSandbox();
    await newSandbox.deploy(`await execTransaction(args.id,{id:args.id})`);
    await newSandbox.closeSandbox();
    const newSandbox2 = new Sandbox(newId);
    await newSandbox2.initSandbox();
    await newSandbox2.execute({ id: newId });
    await newSandbox2.closeSandbox();
  });
});
