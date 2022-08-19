import ResolverBase from '../common/Resolver-Base';
import { Template } from '../models';

class Resolvers extends ResolverBase {
  public getTemplateByName = async (parent: {}, args: { name: string }) => {
    try {
      const template = await Template.findOne({ name: args.name }, {});
      return template;
    } catch (error) {
      throw new Error('Template not found');
    }
  };
}

export const templateResolver = new Resolvers();

export default {
  Query: {
    template: templateResolver.getTemplateByName,
  },
};
