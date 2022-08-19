import { logger } from 'tests/mocks/common/logger';

jest.mock('src/common', () => ({
  config: {},
  logger: logger,
}));

import { AuthenticationError } from 'apollo-server-express';
import { connection } from 'mongoose';
import { Request } from 'express';
import { DataSources, Context } from 'src/types';

//#region mocks
import { createUser } from 'tests/creators/data-sources';
import { createContext } from 'tests/creators/types';
import { dbHandler } from 'tests/db';
import { blockbotReport1, blockbotReport2 } from 'tests/mocks/models';

/**
 * Need to mock src/common/Resolver-Base because
 * the block-bot resolver import it directly
 * instead of use import {ResolverBase} from src/common
 */
const resolverBase = jest.fn().mockImplementation(() => ({
  requireAuth: (user: { userId: string }) => {
    if (!user) throw new AuthenticationError('Authentication required');
  },
}));

jest.mock('src/common/Resolver-Base', () => ({
  default: resolverBase,
}));
//#endregion mocks

import blockbotResolver from 'src/resolvers/blockbot';

describe('Check the the blockbotToken query', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  const mockedContext = createContext(
    ({} as Partial<Request>) as Request,
    ({} as Partial<DataSources>) as DataSources,
    createUser(blockbotReport1.userId),
  );

  const userId2 = blockbotReport2.userId;
 

  it.each`
    role        | otherUser      | blockbotReport     | description
    ${'admin'}  | ${userId2} | ${blockbotReport1} | ${'other user'}
    ${'admin'}  | ${undefined}   | ${blockbotReport2} | ${'user'}
    ${'member'} | ${userId2} | ${blockbotReport2} | ${'user'}
    ${'member'} | ${undefined}   | ${blockbotReport2} | ${'user'}
  `(
    'Should return nothing for a user with role $role and other user id is $otherUser if the $description has not a blockbotReport',
    async ({ role, otherUser, blockbotReport }) => {
      mockedContext.user.role = role;
      const args = { userId: otherUser };

      await connection
      .collection('win-report-token-blockbots')
      .insertOne(blockbotReport);

      const result = await blockbotResolver.Query.getBlockbotTokens(
        null,
        args,
        mockedContext,
      );
      expect(result).not.toEqual(expect.anything());
    },
  );  

  it.each`
    role        | otherUser      | expected           | description
    ${'admin'}  | ${userId2} | ${blockbotReport2} | ${'for the other user'}
    ${'admin'}  | ${undefined}   | ${blockbotReport1} | ${'for the user'}
    ${'member'} | ${userId2} | ${blockbotReport1} | ${'for the user'}
    ${'member'} | ${undefined}   | ${blockbotReport1} | ${'for the user'}
  `(
    'Should, when user.role is $role and other user id is $otherUser return the last BlockbotTokenReport $description',
    async ({ role, otherUser, expected }) => {
      await connection
        .collection('win-report-token-blockbots')
        .insertMany([blockbotReport1, blockbotReport2]);

      const args = { userId: otherUser };
      mockedContext.user.role = role;

      const result = await blockbotResolver.Query.getBlockbotTokens(
        null,
        args,
        mockedContext,
      );
      expect(result).not.toBeNull();
      expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
    },
  );

  it('should deny authorization if a user is not present', async () => {
    //Doing this the user is omited in the context var.
    let mockedContext: Partial<Context> = {};
    await expect(
      blockbotResolver.Query.getBlockbotTokens(
        null,
        {},
        mockedContext as Context,
      ),
    ).rejects.toEqual(new AuthenticationError('Authentication required'));
  });

});