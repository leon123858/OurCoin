"use strict";

const assert = require("bsert");
const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database Const
const dbName = "ourCoin";
const contractCollectionName = "contract";

/**
 * ContractPool Error
 * An error thrown from the ContractPool,
 * @alias module:script.ContractPoolError
 * @extends Error
 * @property {String} message - Error message.
 */

class ContractPoolError extends Error {
  /**
   * Create an error.
   * @constructor
   * @param {String} code - Error code.
   * @param {String} op - operation type.
   * @param {error} error - error from SDK.
   */

  constructor(code, op, error = { message: "no message" }) {
    super();

    this.type = "ContractPoolError";
    this.code = code;
    this.message = `${op}:${error.message}`;

    if (Error.captureStackTrace)
      Error.captureStackTrace(this, ContractPoolError);
  }
}

class ContractPool {
  async init() {
    try {
      await client.connect();
    } catch (error) {
      throw new ContractPoolError("connect mongodb fail", "CONTRACT_POOL");
    }
  }

  async close() {
    try {
      await client.close();
    } catch (error) {
      throw new ContractPoolError("close mongodb fail", "CONTRACT_POOL");
    }
  }

  async deploy(timestamp, uid, address) {
    const db = client.db(dbName);
    const collection = db.collection(contractCollectionName);
    try {
      await collection.updateOne(
        {
          uid,
        },
        { $set: { timestamp, address } },
        { upsert: true }
      );
    } catch (error) {
      throw new ContractPoolError(
        "deploy contract error",
        "CONTRACT_POOL",
        error
      );
    }
  }

  async call(timestamp, uid) {
    const db = client.db(dbName);
    const collection = db.collection(contractCollectionName);
    try {
      const result = await collection.findOne({
        uid,
      });
      if (result?.timestamp && timestamp > result.timestamp) {
        await collection.updateOne(
          {
            uid,
          },
          { $set: { timestamp } },
          {}
        );
        return true;
      }
      return false;
    } catch (error) {
      throw new ContractPoolError(
        "call contract error",
        "CONTRACT_POOL",
        error
      );
    }
  }

  async transfer(timestamp, newAddress, uid) {
    const db = client.db(dbName);
    const collection = db.collection(contractCollectionName);
    try {
      const result = await collection.findOne({
        uid,
      });
      if (result?.timestamp && timestamp > result.timestamp) {
        await collection.updateOne(
          {
            uid,
          },
          { $set: { address: newAddress, timestamp } },
          {}
        );
        return true;
      }
      return false;
    } catch (error) {
      throw new ContractPoolError(
        "transfer contract error",
        "CONTRACT_POOL",
        error
      );
    }
  }
}

module.exports = { ContractPool };
