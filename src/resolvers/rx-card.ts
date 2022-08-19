import { Context } from 'src/types/context';
import ResolverBase from 'src/common/Resolver-Base';

class Resolvers extends ResolverBase {    
    public sendToRxCard = async (
        parent: any,
        args: {          
            email?: string;
        },
        { user, dataSources }: Context,
    ) => {
        this.requireAuth(user);    
        const { sendEmail } = dataSources;    
        const profile: any = await user.findFromDb();
        const is_sent = await sendEmail.sendRxCard(profile, args.email);

        if (is_sent) {
            return {
                success: true,
                message: `Email on its way! Please allow a few minutes for it to arrive.`,
            };
        }
    
        if (!is_sent) {
            return {
                success: false,
                message: `Something Went Wrong.`,
            };
        }
    }
}

const resolvers = new Resolvers();

export default {    
    Mutation: {
      sendToRxCard: resolvers.sendToRxCard,
    },
};
  