const { MongoMemoryServer } = require("mongodb-memory-server");
let mongoServer;
before(async () => {
  console.log("Start Test");
  mongoServer = await MongoMemoryServer.create({ instance: { port: 27017 } });
});
after(async () => {
  await mongoServer.stop();
  console.log("End Test");
});
