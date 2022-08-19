import { Request } from 'express';
import { Types } from 'mongoose';
import { ServerAuth } from '@blockbrothers/firebasebb';
import { IUser } from 'src/models';
import { blueUser, connectUser } from 'tests/mocks/models';
import { createBitly, createUser } from 'tests/creators/data-sources';
import { createAuth } from 'tests/creators/common';
import { createContext, createDataSources } from 'tests/creators/types';
import { createRequest } from 'tests/creators/express';
import { logger } from 'tests/mocks/common/logger';

const crypto = {};

const careclix = {
  signUp: async (user: IUser, password: string) => true,
};

const s3 = {
  getUrlFromFilename: (filename: string) =>
    `https://bucket.s3.amazonaws.com/${filename}`,
};

const bitly = createBitly('https://bittly.com/short');
const userApi = createUser(blueUser.userId);

jest.mock('src/data-sources', () => ({
  bitly: bitly,
  UserApi: userApi,
}));

import { Bitly, UserApi } from 'src/data-sources';

UserApi.fromCustomToken = (token: string) => userApi as UserApi;

const token = 'token';

const auth = createAuth(token, blueUser.userId);

const config = {
  brand: 'blue',
  nodeEnv: 'development',
  rewardDistributerPkey: '0x1f',
  sendGridApiKey: 'SG.test',
  supportsDisplayNames: true,
};

const resolverBase = jest.fn().mockImplementation(() => ({
  requireAuth: (user: UserApi) => false,
}));

jest.mock('src/utils/crypto', () => crypto);

jest.mock('src/services', () => ({
  careclix: careclix,
  s3: s3,
}));

jest.mock('src/common', () => ({
  auth: auth,
  config: config,
  logger: logger,
  ResolverBase: resolverBase,
}));

import { DataSources, Context } from 'src/types';
import userResolver from 'src/resolvers/user';
import { dbHandler } from 'tests/db';

describe('User Resolver', () => {
  const ip = '127.0.0.1';
  const blueBrand = 'blue';
  const connectBrand = 'connect';

  const request = createRequest(token);
  const dataSources = createDataSources(bitly);

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    dbHandler.collection('templates').insertOne({
      _id: new Types.ObjectId(),
      id: 'terms-of-service',
      name: 'terms-of-service',
    });

    dbHandler.collection('templates').insertOne({
      _id: new Types.ObjectId(),
      id: 'privacy-policy',
      name: 'privacy-policy',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  it('should create a blue user', async () => {
    config.brand = blueBrand;

    const args = {
      userInfo: blueUser,
      ipAddress: ip,
    };

    const context = createContext(request, dataSources);
    const response = await userResolver.Mutation.createUser(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.token).toBe(token);
  });

  it('should update a blue user', async () => {
    dbHandler.collection('users').insertOne(blueUser);

    config.brand = blueBrand;

    const args = {
      userInfo: blueUser,
      ipAddress: ip,
    };

    const context = createContext(request, dataSources, userApi);
    const response = await userResolver.Mutation.updateUser(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.success).toBeTruthy();
    expect(response.user).not.toBeNull();
  });

  it('should create a connect user', async () => {
    config.brand = connectBrand;

    const args = {
      userInfo: connectUser,
      ipAddress: ip,
    };

    const context = createContext(request, dataSources);
    const response = await userResolver.Mutation.createUser(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.token).toBe(token);
  });

  it('should update a connect user', async () => {
    dbHandler.collection('users').insertOne(connectUser);

    config.brand = connectBrand;

    const args = {
      userInfo: connectUser,
      ipAddress: ip,
    };

    const context = createContext(request, dataSources, userApi);
    const response = await userResolver.Mutation.updateUser(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.success).toBeTruthy();
    expect(response.user).not.toBeNull();
  });
});
