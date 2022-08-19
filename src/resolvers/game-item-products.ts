import { Context } from '../types';
import ResolverBase from '../common/Resolver-Base';
import { GameitemProduct } from '../models';
import {
  availableGameItemProductsPipeline,
  getGameItemProductByBaseId,
  //IGetGameItemProductByBaseIdResult,
} from '../pipelines';

class Resolvers extends ResolverBase {
  getAvailableGameItemProducts = async (
    parent: any,
    args: { game: string },
    ctx: Context,
  ) => {
    return GameitemProduct.aggregate(
      availableGameItemProductsPipeline(args.game),
    );
  };

  getNodeProduct = async (parent: any, args: {}, ctx: Context) => {
    const [product] = (await GameitemProduct.aggregate(
      getGameItemProductByBaseId('gala-node-license'),
    ));
    if (!product) {
      throw new Error('Node product not found');
    }

    return product;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    gameItemProducts: resolvers.getAvailableGameItemProducts,
    nodeProduct: resolvers.getNodeProduct,
  },
};
