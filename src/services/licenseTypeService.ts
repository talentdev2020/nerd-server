import { logger } from 'src/common';
import {
    ILicenseCount, ILicenseCountAndNodesOnlineResponse,
} from 'src/types';
import { getLicensesTypesCountsPipeline } from 'src/pipelines'
import { License } from 'src/models';
import { nodeServices } from 'src/services';

export class LicenseTypeService {
    getLicenseTypeCountAndNodesOnline = async (userId: string): Promise<ILicenseCountAndNodesOnlineResponse> => {
        const nodesOnline = await nodeServices.getNodesOnline(userId);
        const licenseCount = await this.getLicenseTypeCountsResponse(userId);
        const response: ILicenseCountAndNodesOnlineResponse = {
            nodesOnline,
            licenseCount,
        }
        return response;

    };

    getLicenseTypeCountsResponse = async (userId: string): Promise<ILicenseCount[]> => {
        try {
            const pipeline = getLicensesTypesCountsPipeline(userId);
            const licenseCounts: ILicenseCount[] = await License.aggregate<ILicenseCount>(pipeline);
            const exists = licenseCounts.some(x => x.name === 'No license type Name' || x.rewardType === 'No license type Reward' || x.nodeType === 'No license Node type')
            if (!exists) {
                logger.info(`No matchable licensesType resolvers.licenseTypeMapping.Service.getLicenseTypeCount`)
            }
            return licenseCounts
        } catch (err) {
            logger.warn(
                `resolvers.licenseTypeMapping.Service.getLicenseTypeCount.catch: ${err}`,
            );
            throw err;
        }
    };
}

export const licenseTypeService = new LicenseTypeService();

export default licenseTypeService;