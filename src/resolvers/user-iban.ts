import { Context } from '../types';
import ResolverBase from '../common/Resolver-Base';

import { UserIban } from 'src/models';
class Resolvers extends ResolverBase {
    public getUserIban = async (
        _parent: any,
        args: {},
        { user }: Context,
    ) => {
        this.requireAuth(user);

        const userIban = await UserIban
            .findOne({ userId: user.userId })
            .lean()
            .exec();

        return userIban;
    };
}

const resolvers = new Resolvers();

export default {
    Query: {
        getUserIban: resolvers.getUserIban,
    },
    Mutation: {},
};
