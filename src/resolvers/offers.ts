import { Context } from '../types/context';
import ResolverBase from '../common/Resolver-Base';
import { Offer } from '../models';

class Resolvers extends ResolverBase {
  getOffers = (_parent: any, _args: any, _context: Context) => {
    return Offer.find({ enabled: true });
  };
}
const resolvers = new Resolvers();

export default {
  Query: {
    offers: resolvers.getOffers,
  },
};
