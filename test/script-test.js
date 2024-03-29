/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

"use strict";

const assert = require("bsert");
const { v4: uid } = require("uuid");
const Script = require("../lib/script/script");
const Witness = require("../lib/script/witness");
const Stack = require("../lib/script/stack");
const Opcode = require("../lib/script/opcode");
const TX = require("../lib/primitives/tx");
const consensus = require("../lib/protocol/consensus");
const { fromFloat } = require("../lib/utils/fixed");
const { ObjectId } = require("mongodb");

// test files: https://github.com/bitcoin/bitcoin/tree/master/src/test/data
const scripts = require("./data/core-data/script-tests.json");

function isSuccess(stack) {
  if (stack.length === 0) return false;

  if (!stack.getBool(-1)) return false;

  return true;
}

function parseScriptTest(data) {
  const witArr = Array.isArray(data[0]) ? data.shift() : [];
  const inpHex = data[0];
  const outHex = data[1];
  const names = data[2] || "NONE";
  const expected = data[3];
  let comments = data[4];

  if (!comments) comments = outHex.slice(0, 60);

  comments += ` (${expected})`;

  let value = 0;
  if (witArr.length > 0) value = fromFloat(witArr.pop(), 8);

  const witness = Witness.fromString(witArr);
  const input = Script.fromString(inpHex);
  const output = Script.fromString(outHex);

  let flags = 0;
  for (const name of names.split(",")) {
    const flag = Script.flags[`VERIFY_${name}`];

    if (flag == null) throw new Error(`Unknown flag: ${name}.`);

    flags |= flag;
  }

  return {
    witness: witness,
    input: input,
    output: output,
    value: value,
    flags: flags,
    expected: expected,
    comments: comments,
  };
}

describe("Script", function () {
  it("should recognize a P2SH output", () => {
    const hex = "a91419a7d869032368fd1f1e26e5e73a4ad0e474960e87";
    const decoded = Script.fromRaw(hex, "hex");
    assert(decoded.isScripthash());
  });

  it("should recognize a Null Data output", () => {
    const hex =
      "6a28590c080112220a1b353930632e6f7267282a5f" +
      "5e294f7665726c6179404f7261636c65103b1a010c";
    const decoded = Script.fromRaw(hex, "hex");
    assert(decoded.isNulldata());
  });

  it("should handle if statements correctly", () => {
    {
      const input = new Script([Opcode.fromInt(1), Opcode.fromInt(2)]);

      const output = new Script([
        Opcode.fromInt(2),
        Opcode.fromSymbol("equal"),
        Opcode.fromSymbol("if"),
        Opcode.fromInt(3),
        Opcode.fromSymbol("else"),
        Opcode.fromInt(4),
        Opcode.fromSymbol("endif"),
        Opcode.fromInt(5),
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(
        stack.items,
        [[1], [3], [5]].map((a) => Buffer.from(a))
      );
    }

    {
      const input = new Script([Opcode.fromInt(1), Opcode.fromInt(2)]);

      const output = new Script([
        Opcode.fromInt(9),
        Opcode.fromSymbol("equal"),
        Opcode.fromSymbol("if"),
        Opcode.fromInt(3),
        Opcode.fromSymbol("else"),
        Opcode.fromInt(4),
        Opcode.fromSymbol("endif"),
        Opcode.fromInt(5),
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(
        stack.items,
        [[1], [4], [5]].map((a) => Buffer.from(a))
      );
    }

    {
      const input = new Script([Opcode.fromInt(1), Opcode.fromInt(2)]);

      const output = new Script([
        Opcode.fromInt(2),
        Opcode.fromSymbol("equal"),
        Opcode.fromSymbol("if"),
        Opcode.fromInt(3),
        Opcode.fromSymbol("endif"),
        Opcode.fromInt(5),
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(
        stack.items,
        [[1], [3], [5]].map((a) => Buffer.from(a))
      );
    }

    {
      const input = new Script([Opcode.fromInt(1), Opcode.fromInt(2)]);

      const output = new Script([
        Opcode.fromInt(9),
        Opcode.fromSymbol("equal"),
        Opcode.fromSymbol("if"),
        Opcode.fromInt(3),
        Opcode.fromSymbol("endif"),
        Opcode.fromInt(5),
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(
        stack.items,
        [[1], [5]].map((a) => Buffer.from(a))
      );
    }

    {
      const input = new Script([Opcode.fromInt(1), Opcode.fromInt(2)]);

      const output = new Script([
        Opcode.fromInt(9),
        Opcode.fromSymbol("equal"),
        Opcode.fromSymbol("notif"),
        Opcode.fromInt(3),
        Opcode.fromSymbol("endif"),
        Opcode.fromInt(5),
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(
        stack.items,
        [[1], [3], [5]].map((a) => Buffer.from(a))
      );
    }
  });

  it("should handle CScriptNums correctly", () => {
    const input = new Script([
      Opcode.fromString("ffffff7f", "hex"),
      Opcode.fromSymbol("negate"),
      Opcode.fromSymbol("dup"),
      Opcode.fromSymbol("add"),
    ]);

    const output = new Script([
      Opcode.fromString("feffffff80", "hex"),
      Opcode.fromSymbol("equal"),
    ]);

    const stack = new Stack();

    input.execute(stack);
    output.execute(stack);

    assert(isSuccess(stack));
  });

  it("should handle CScriptNums correctly", () => {
    const input = new Script([
      Opcode.fromInt(11),
      Opcode.fromInt(10),
      Opcode.fromInt(1),
      Opcode.fromSymbol("add"),
    ]);

    const output = new Script([
      Opcode.fromSymbol("numnotequal"),
      Opcode.fromSymbol("not"),
    ]);

    const stack = new Stack();

    input.execute(stack);
    output.execute(stack);

    assert(isSuccess(stack));
  });

  it("should handle OP_ROLL correctly", () => {
    const input = new Script([
      Opcode.fromInt(0x16),
      Opcode.fromInt(0x15),
      Opcode.fromInt(0x14),
    ]);

    const output = new Script([
      Opcode.fromInt(0),
      Opcode.fromSymbol("roll"),
      Opcode.fromInt(0x14),
      Opcode.fromSymbol("equalverify"),
      Opcode.fromSymbol("depth"),
      Opcode.fromInt(2),
      Opcode.fromSymbol("equal"),
    ]);

    const stack = new Stack();

    input.execute(stack);
    output.execute(stack);

    assert(isSuccess(stack));
  });

  it("should handle OP_Contract correctly", async () => {
    const id = uid();
    // TODO: deploy contract to sandbox
    const input = new Script([
      Opcode.fromString("fakepublicaddress"),
      Opcode.fromString(id),
      Opcode.fromString(
        `state.number = state.number ? state.number + 1 : args.number;
        if (state.message==undefined) state["message"] = args.message;`
      ),
      Opcode.fromSymbol("deploycontract"),
    ]);
    // TODO: call/transfer contract
    const args = { message: "Hello Smart Contract!!", number: 5 };
    const output = new Script([
      Opcode.fromString(JSON.stringify(args)),
      Opcode.fromString(id),
      Opcode.fromSymbol("callcontract"),
      Opcode.fromString("newpublicaddress"),
      Opcode.fromString(id),
      Opcode.fromSymbol("transfercontract"),
    ]);

    const stack = new Stack();

    await input.execute(stack, null, null, null, null, null);
    await output.execute(stack, null, null, null, null, null);

    assert(stack.length == 0);
  });

  it("should handle data script test", async () => {
    for (const data of scripts) {
      if (data.length === 1) continue;

      const test = parseScriptTest(data);
      const { witness, input, output } = test;
      const { value, flags } = test;
      const { expected, comments } = test;

      for (const noCache of [false, true]) {
        const suffix = noCache ? "without cache" : "with cache";

        // Funding transaction.
        const prev = new TX({
          version: 1,
          inputs: [
            {
              prevout: {
                hash: consensus.ZERO_HASH,
                index: 0xffffffff,
              },
              script: [Opcode.fromInt(0), Opcode.fromInt(0)],
              witness: [],
              sequence: 0xffffffff,
            },
          ],
          outputs: [
            {
              script: output,
              value: value,
            },
          ],
          locktime: 0,
        });

        // Spending transaction.
        const tx = new TX({
          version: 1,
          inputs: [
            {
              prevout: {
                hash: prev.hash(),
                index: 0,
              },
              script: input,
              witness: witness,
              sequence: 0xffffffff,
            },
          ],
          outputs: [
            {
              script: [],
              value: value,
            },
          ],
          locktime: 0,
        });

        if (noCache) {
          prev.refresh();
          tx.refresh();
        }

        let err;
        try {
          await Script.verify(input, witness, output, tx, 0, value, flags);
        } catch (e) {
          err = e;
        }

        if (expected !== "OK") {
          assert(err instanceof Error);
          assert.strictEqual(err.code, expected, `${suffix}:${comments}`);
          return;
        }

        assert.ifError(err);
      }
    }
  });
});
