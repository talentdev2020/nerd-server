const config = {};
import { logger } from 'tests/mocks/common/logger';

const resolverBase = jest.fn().mockImplementation(() => ({
  requireAuth: (user: UserApi) => false,
}));

jest.mock('src/common', () => ({
  config: config,
  logger: logger,
  ResolverBase: resolverBase,
}));

import { Types } from 'mongoose';
import { blueUser } from 'tests/mocks/models';
import { createBitly, createUser } from 'tests/creators/data-sources';
import { createContext, createDataSources } from 'tests/creators/types';
import { createRequest } from 'tests/creators/express';

const bitly = createBitly('https://bittly.com/short');
const userApi = createUser(blueUser.userId);

jest.mock('src/data-sources', () => ({
  Bitly: jest.fn().mockImplementation(() => bitly),
  UserApi: userApi,
}));

import {  UserApi } from 'src/data-sources';
import licenseResolver from 'src/resolvers/license';
import { dbHandler } from 'tests/db';

describe('License Resolver', () => {
  const token = 'token';
  const licenseId = '6114c774f28b6b4544c3de47';
  const licenseType = '5e692efd426618edbed9b9a7';
  const context = createContext(
    createRequest(token),
    createDataSources(bitly),
    userApi,
  );

  const license = {
    _id: new Types.ObjectId(licenseId),
    licenseTypeId: '',
    userId: '',
    created: new Date(),
    inUse: false,
    ownershipHistory: [
      {
        _id: new Types.ObjectId('5e87914b7bc3ef58c6782408'),
        receivedReason:
          'connect-stage::OrderId::5ce70f00b2ea3f09e352ab3a::license migration sc...',
        received: new Date(),
      },
    ],
  };

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  it('should get a license by user id', async () => {
    license.userId = blueUser.userId;
    license.licenseTypeId = '';

    dbHandler.collection('licenses').insertOne(license);

    const type: string = null;

    const args = {
      type: type,
    };

    const response = await licenseResolver.Query.getLicenses(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.length).toBe(1);
    expect(response[0].userId).toBe(blueUser.userId);
  });

  it('should get a license by type', async () => {
    license.userId = blueUser.userId;
    license.licenseTypeId = licenseType;

    dbHandler.collection('licenses').insertOne(license);

    const args = {
      type: licenseType,
    };

    const response = await licenseResolver.Query.getLicenses(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.length).toBe(1);
    expect(response[0].licenseTypeId).toBe(licenseType);
  });

  it('should not get a license', async () => {
    license.userId = '';
    license.licenseTypeId = '';

    dbHandler.collection('licenses').insertOne(license);

    const type: string = null;

    const args = {
      type: type,
    };

    const response = await licenseResolver.Query.getLicenses(
      null,
      args,
      context,
    );

    expect(response).not.toBeNull();
    expect(response.length).toBe(0);
  });
});
