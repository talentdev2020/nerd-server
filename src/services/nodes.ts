import ResolverBase from 'src/common/Resolver-Base';
import { logger } from 'src/common';
import {
    MiningRecord,
} from '../models';

class NodesServices extends ResolverBase {
    getNodesOnline = async (userId: string) => {
        logger.debug('GET_NODES_ONLINE');
        try {
            const now = Date.now();
            const timeToCheckAgainst = new Date(now - 1000 * 60 * 30);
            logger.debug(`services.nodes.getNodesOnline.userId: ${userId}`);
            const nodesOnline = await MiningRecord.find({
                userId,
                stop: { $eq: null },
                'lastCheckIn.time': { $gt: timeToCheckAgainst },
            })
                .countDocuments()
                .exec();
            return nodesOnline;
        } catch (err) {
            logger.warn(`services.nodes.getNodesOnline.catch: ${err}`);
            return {
                success: false,
                message: err,
            };
        }
    };

}

export const nodeServices = new NodesServices();