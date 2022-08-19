import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

class DbHandler {
  private mongo: MongoMemoryServer;

  public async connect() {
    await mongoose.disconnect();

    this.mongo = await MongoMemoryServer.create();
    const uri = await this.mongo.getUri();

    await mongoose.connect(uri);
  }

  public collection(name: string) {
    return mongoose.connection.collection(name);
  }

  public async closeDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.mongo.stop();
  }

  public async clearDatabase() {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

export default new DbHandler();
