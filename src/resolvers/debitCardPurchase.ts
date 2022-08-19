import { Context } from '../types/context';
import ResolverBase from '../common/Resolver-Base';
import cart from '../services/cart';
import { CartStatus } from '../types';
import { Card } from '../models';
import { ICartFiatTransaction } from 'src/models';

class Resolvers extends ResolverBase {
  public getAvailableDebitCards = async (
    parent: any,
    args: {},
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);

    return await Card.find();
  };

  public submitDebitCardPurchase = async (
    parent: any,
    args: {
      purchase: {
        userId: string;
        orderId: string;
        card: {
          type: string;
          price: number;
          description: string;
          title: string;
          details: string[];
        };
        referenceId: string;
        customerAddress: {
          address1: string;
          city: string;
          postalCode: string;
          state: string;
          country: string;
        };
      };
    },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);

    const userDoc = await user.findFromDb();

    const {
      userId,
      orderId,
      card,
      referenceId,
      customerAddress,
    } = args.purchase;

    const { type, price, description, title, details } = card;

    const { address1, city, postalCode, state, country } = customerAddress;

    const cartFiatTransaction: ICartFiatTransaction = {
      userId: userId,
      status: CartStatus[CartStatus.complete],
      currency: 'USD',
      discountAmtUsd: '0',
      totalUsd: card.price.toString(),
      conversionRate: '1',
      address: customerAddress.address1 ?? '',
      name: `${userDoc.firstName} ${userDoc.lastName}`,
      email: userDoc.email,
      created: new Date(),
      productId: card.type,
      productName: card.title,
      quantity: 1,
      revenueUsd: card.price,
      isCommissionable: true,

      wp_id: '',
      totalCrypto: '',
      totalCryptoReceived: '',
      remainingCrypto: '',
      memberId: '',
      data: '',
      redisKey: '',
      redisValue: '',
      revenueCrypto: 0,

      orderId: orderId,
      checkReferenceId: referenceId,
    };
    return await cart.createFiatTransaction(cartFiatTransaction);
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    getAvailableDebitCards: resolvers.getAvailableDebitCards,
  },
  Mutation: {
    submitDebitCardPurchase: resolvers.submitDebitCardPurchase,
  },
};
