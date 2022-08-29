import { ForbiddenError } from 'apollo-server-express';
const config = {
  brand: "green"
};
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
import { adminUser, blueUser } from 'tests/mocks/models';
import { createBitly, createUser } from 'tests/creators/data-sources';
import { createContext, createDataSources } from 'tests/creators/types';
import { createRequest } from 'tests/creators/express';

const bitly = createBitly('https://bittly.com/short');
const adminUserApi = createUser(adminUser.userId, "admin");
const userApi = createUser(blueUser.userId);

import {  UserApi } from 'src/data-sources';
import cartProductResolver from 'src/resolvers/cart-products';
import { dbHandler } from 'tests/db';

describe('CartProducts Resolver', () => {
  const token = 'token';
  const cartProductId = '62828821ccffcf4c793d32a4';
  const adminContext = createContext(
    createRequest(token),
    createDataSources(bitly),
    adminUserApi,
  );
  const context = createContext(
    createRequest(token),
    createDataSources(bitly),
    userApi,
  );

  const cartProduct = {
    _id: new Types.ObjectId(cartProductId),
    name: "new cart product",
    costUpfront: 100,
    costSubscription: 50,
    meprId: 9620,
    created: new Date(),
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

  it('Should admin create cart product', async () => {
    const args = {
      name: cartProduct.name,
      costUpfront: cartProduct.costUpfront,
      costSubscription: cartProduct.costSubscription,
      meprId: cartProduct.meprId,
    };

    await cartProductResolver.Mutation.createCartProduct(
      null,
      args,
      adminContext,
    );

    const response = await dbHandler.collection('cart-products').findOne({meprId: cartProduct.meprId});

    expect(response).not.toBeNull();
    expect(response.meprId).toBe(cartProduct.meprId);
    expect(response.costUpfront).toBe(cartProduct.costUpfront);
  });

  it('Should not allow member to create cart product', async () => {
    const args = {
      name: cartProduct.name,
      costUpfront: cartProduct.costUpfront,
      costSubscription: cartProduct.costSubscription,
      meprId: cartProduct.meprId,
    };

    try {
      await cartProductResolver.Mutation.createCartProduct(
      null,
      args,
      context,)
      expect(true).toBe(false);
    } catch(err) {
      expect(err).toBeInstanceOf(ForbiddenError);
    }
  });

  it('Should get a cart product by id', async () => {
    await dbHandler.collection('cart-products').insertOne(cartProduct);

    const args = {
      productId: cartProductId,
    };

    const response = await cartProductResolver.Query.getCartProductById(
      null,
      args,
    );

    expect(response.success).toBe(true);
    expect(response.data.meprId).toBe(cartProduct.meprId);
    expect(response.data.costUpfront).toBe(cartProduct.costUpfront);
  });

  it('Should get a cart product by meprId', async () => {
    await dbHandler.collection('cart-products').insertOne(cartProduct);

    const args = {
      meprId: cartProduct.meprId,
    };

    const response = await cartProductResolver.Query.getCartProductByMeprId(
      null,
      args,
    );

    expect(response.success).toBe(true);
    expect(response.data.costUpfront).toBe(cartProduct.costUpfront);
  });

  it('Should get all cart products', async () => {
    await dbHandler.collection('cart-products').insertOne(cartProduct);

    const response = await cartProductResolver.Query.getAllCartProducts();

    expect(response).not.toBeNull();
    expect(response[0].costUpfront).toBe(cartProduct.costUpfront);
    expect(response[0].meprId).toBe(cartProduct.meprId);
  });

  it('Should admin update cost', async () => {
    const newPrice = 200;
    await dbHandler.collection('cart-products').insertOne(cartProduct);

    const args = {
      meprId: cartProduct.meprId,
      costUpFront: newPrice,
    };

    const updateResponse = await cartProductResolver.Mutation.updateCartProductCostUpFront(
      null,
      args,
      adminContext,
    );

    expect(updateResponse.success).toBe(true);

    const cartProductResponse = await dbHandler.collection('cart-products').findOne({
      meprId: cartProduct.meprId
    });

    expect(cartProductResponse.costUpfront).toBe(newPrice);
  });

  it('Should not member to update cost', async () => {
    const newPrice = 200;
    await dbHandler.collection('cart-products').insertOne(cartProduct);

    const args = {
      meprId: cartProduct.meprId,
      costUpFront: newPrice,
    };

    try {
      const response = await cartProductResolver.Mutation.updateCartProductCostUpFront(
        null,
        args,
        context,
      );
      expect(true).toBe(false);
    } catch(err) {
      expect(err).toBeInstanceOf(ForbiddenError);
    }
  });

  it('Should admin link license types', async () => {
    const quantity = 1;
    const licenseType = {
      _id: new Types.ObjectId("61f0ab41aa03788632452cbd"),
      id: "61f0ab41aa03788632452cbd",
      name: "new License",
      rewardType: "Blue",
      environmentType: "blue",
      topPerformingMinerRewardPerDollarMined: 1,
      remainingMinerRewardPerDollarMined: 2,
      concurrentDevices: 3,
      promoPointsPerDay: 4,
      destinationLicenseTypeId: "6114c774f28b6b4544c3de47",
    };
    await dbHandler.collection('license-types').insertOne(licenseType);

    await dbHandler.collection('cart-products').insertOne(cartProduct);
    const args = {
      meprId: cartProduct.meprId,
      licenses: [{
        licenseTypeId: licenseType.id,
        quantity
      }],
    };

    const response = await cartProductResolver.Mutation.setLinkLicenseTypeCartProduct(
      null,
      args,
      adminContext,
    );

    expect(response.success).toBe(true);

    const linkedProductResponse = await dbHandler.collection('cart-products').findOne({
      meprId: cartProduct.meprId
    });

    expect(linkedProductResponse.licenses.length).toBe(1);
    expect(linkedProductResponse.licenses[0].licenseTypeId).toBe(licenseType.id);
    expect(linkedProductResponse.licenses[0].quantity).toBe(quantity);
  });

  it('Should not allow member to link license types', async () => {
    const quantity = 1;
    const licenseType = {
      _id: new Types.ObjectId("61f0ab41aa03788632452cbd"),
        id: "61f0ab41aa03788632452cbd",
        name: "new License",
        rewardType: "Blue",
        environmentType: "blue",
        topPerformingMinerRewardPerDollarMined: 1,
        remainingMinerRewardPerDollarMined: 2,
        concurrentDevices: 3,
        promoPointsPerDay: 4,
        destinationLicenseTypeId: "6114c774f28b6b4544c3de47",
    };
    await dbHandler.collection('license-types').insertOne(licenseType);

    await dbHandler.collection('cart-products').insertOne(cartProduct);
    const args = {
      meprId: cartProduct.meprId,
      licenses: [{
        licenseTypeId: licenseType.id,
        quantity
      }],
    };
    try {
      await cartProductResolver.Mutation.setLinkLicenseTypeCartProduct(
        null,
        args,
        context,
      );
     expect(true).toBe(false);
    } catch(err) {
      expect(err).toBeInstanceOf(ForbiddenError);
    }
  });

});
