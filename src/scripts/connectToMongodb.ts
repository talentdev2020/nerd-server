import * as mongoose from 'mongoose';
import { MongoError } from 'mongodb';

export default function connectToMongoose(mongodbUri: string) {
  return new Promise<void>((resolve, reject) => {
    mongoose.connect(mongodbUri, (err: MongoError) => {
      if (err) {
        reject(err);
      } else {
        console.log('MongoDB Connected');
        resolve();
      }
    });
  });
}
