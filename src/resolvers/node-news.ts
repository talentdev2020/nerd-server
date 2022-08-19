import { logger, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import {
  INodeNews,
} from 'src/types';
import {
  NodeNewsModel,
} from 'src/models';

class NodeNews extends ResolverBase {
  getNodeNews = async (
    parent: any,
    args: { limit: number, months: number },
    ctx: Context,
  ): Promise<INodeNews[]> => {
    const { user } = ctx;
    this.requireAdmin(user);
    let nodeNews: INodeNews[];
    const {limit, months} = args;
    try {
      if (months) {
        const now = new Date();

        now.setMonth(now.getMonth() - months);
        const from = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
        if (limit) {
          nodeNews= await NodeNewsModel.find({
            date: {
              $gte: from,
            },
          }).limit(limit);
        } else {
          nodeNews= await NodeNewsModel.find({
            date: {
              $gte: from,
            },
          });
        }
      } else {
        if (limit) {
          nodeNews = await NodeNewsModel.find().limit(limit);
        } else {
          nodeNews = await NodeNewsModel.find();
        }
      }
    } catch (err) {
      logger.warn(
        `resolvers.nodeNews.getNodeNews.catch: ${err}`,
      );
      throw err;
    }
    return nodeNews;
  };
  createNodeNews = async (
    parent: any,
    args: { text: string, link: string },
    ctx: Context,
  ): Promise<INodeNews> => {
    const { user } = ctx;
    this.requireAdmin(user);
    const { text, link } = args;
    let nodeNews: INodeNews;
    try {
      nodeNews = await NodeNewsModel.create({
        text,
        date: new Date(),
        link,
      });
    } catch (err) {
      logger.warn(
        `resolvers.nodeNews.createNodeNews.catch: ${err}`,
      );
      throw err;
    }
    return nodeNews;
  };

  editNodeNews = async (
    parent: any,
    args: { id:string, text: string, link: string },
    ctx: Context,
  ): Promise<INodeNews> => {
    const { user } = ctx;
    this.requireAdmin(user);
    const { id, text, link } = args;

    try {
      const nodeNews: INodeNews = await NodeNewsModel.findByIdAndUpdate(
        id,
        {
          $set: { text, link, date: new Date() },
        },
        { new: true },
      );
      return nodeNews;
    } catch (err) {
      logger.warn(
        `resolvers.nodeNews.editNodeNews.catch: ${err}`,
      );
      throw err;
    }
  };
}

const resolvers = new NodeNews();

export default {
  Query: {
    getNodeNews: resolvers.getNodeNews,
  },
  Mutation: {
    editNodeNews: resolvers.editNodeNews,
    createNodeNews: resolvers.createNodeNews,
  },
};
