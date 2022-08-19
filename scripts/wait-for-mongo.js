#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

const timeout = 1500;
const attempts = 3;

dotenv.load();
const mongoURI =
  process.env['MONGODB_URI_' + process.env['BRAND'].toUpperCase()];
const client = new MongoClient(mongoURI);

async function connect() {
  try {
    await client.connect();
  } finally {
    await client.close();
  }
}

const waitForMongo = count => {
  return connect()
    .then(() => {
      console.log('Mongo is available!');
      process.exit(0);
    })
    .catch(err => {
      if (count >= attempts) {
        console.log('Mongo unavailable!');
        process.exit(1);
      } else {
        setTimeout(() => canConnect(count + 1), timeout);
      }
    });
};

waitForMongo(0);
