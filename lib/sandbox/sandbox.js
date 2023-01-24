"use strict";

const assert = require("bsert");
const Interpreter = require("vm2");
const { MongoClient } = require("mongodb");
const url = "mongodb://0.0.0.0:27017";
const client = new MongoClient(url);

// Database Const
const dbName = "ourCoin";
const codeCollectionName = "code";
const stateCollectionName = "state";

/**
 * Sandbox Error
 * An error thrown from the sandbox system,
 * potentially pertaining to smart contract operation.
 * @alias module:script.SandboxError
 * @extends Error
 * @property {String} message - Error message.
 */

class SandboxError extends Error {
  /**
   * Create an error.
   * @constructor
   * @param {String} code - Error code.
   * @param {String} op - operation type.
   * @param {error} error - error from SDK.
   */

  constructor(code, op, error = { message: "no message" }) {
    super();

    this.type = "SandboxError";
    this.code = code;
    this.message = `${op}:${error.message}`;

    if (Error.captureStackTrace) Error.captureStackTrace(this, SandboxError);
  }
}

/**
 * Sandbox
 * a sandbox to run smart contract in it
 * can be used in bitcoin script
 * @base js-interpreter
 * @abstract
 */

class Sandbox {
  /**
   * init target contract
   * @param {string} transactionId transaction's id which have target contract
   */
  constructor(transactionId) {
    assert(transactionId, "Sandbox deploy contract need transactionId");
    this.transactionId = transactionId;
  }

  async initSandbox() {
    try {
      await client.connect();
    } catch (error) {
      throw new SandboxError("connect mongodb fail", "CONTRACT");
    }
  }

  async closeSandbox() {
    try {
      await client.close();
    } catch (error) {
      throw new SandboxError("close mongodb fail", "CONTRACT");
    }
  }

  /**
   * deploy code into database
   * @param {string} code code for smart contract
   */
  async deploy(code) {
    assert(code, "Sandbox deploy contract need code");
    const db = client.db(dbName);
    const collection = db.collection(codeCollectionName);
    try {
      await collection.updateOne(
        {
          txid: this.transactionId,
        },
        { $set: { code } },
        { upsert: true }
      );
    } catch (error) {
      throw new SandboxError("INSERT CODE ERROR", "DEPLOYCONTRACT", error);
    }
  }
  /**
   * 合約內部執行合約
   * @param {string} id 合約編號
   * @param {object} params 合約參數
   * @returns
   */
  async executeTransaction(id, params) {
    const innerSandbox = new Sandbox(id);
    // client for mongo 公用所以可以直接執行
    const resultState = await innerSandbox.execute(params);
    return resultState;
  }

  /**
   * execute contract, will load and save new state
   * @param {object} args arguments for contract
   */
  async execute(args) {
    const code = await this.fetchCode();
    const state = await this.loadState();
    const interpreter = new Interpreter.VM({
      sandbox: {
        state,
        args,
        execTransaction: this.executeTransaction,
      },
      allowAsync: true,
    });
    try {
      await interpreter.run(`
      (async function(){
        ${code}
        return Promise.resolve(0);
      }());
      `);
      const newState = interpreter.run("state");
      await this.saveState(newState);
      return newState;
    } catch (error) {
      throw new SandboxError("INTERPRETER ERROR", "CALLCONTRACT", error);
    }
  }

  /**
   * get the code of contract
   * @param {string} id transactionId default:this.transactionId
   * @returns string of code
   */
  async fetchCode(id = this.transactionId) {
    const db = client.db(dbName);
    const collection = db.collection(codeCollectionName);
    try {
      const result = await collection.findOne({
        txid: id,
      });
      return result.code || "";
    } catch (error) {
      throw new SandboxError("FETCH CODE ERROR", "CALLCONTRACT", error);
    }
  }

  /**
   * load state from database
   * @param {string} id transactionId default:this.transactionId
   * @returns obj of state
   */
  async loadState(id = this.transactionId) {
    const db = client.db(dbName);
    const collection = db.collection(stateCollectionName);
    try {
      const result = await collection.findOne({
        txid: id,
      });
      return result?.state || {};
    } catch (error) {
      throw new SandboxError("LOAD STATE ERROR", "CALLCONTRACT", error);
    }
  }

  /**
   * save state(buffer) in database
   * @param {object} newState the newState of contract
   * @param {string} id transactionId default:this.transactionId
   */
  async saveState(newState = {}, id = this.transactionId) {
    const db = client.db(dbName);
    const collection = db.collection(stateCollectionName);
    try {
      await collection.updateOne(
        {
          txid: id,
        },
        { $set: { state: newState } },
        { upsert: true }
      );
    } catch (error) {
      throw new SandboxError("SAVE STATE ERROR", "CALLCONTRACT", error);
    }
  }
}

module.exports = { Sandbox };
