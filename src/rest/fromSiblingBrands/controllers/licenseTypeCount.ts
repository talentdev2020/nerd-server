import { Request, Response } from 'express';
import { licenseTypeService } from 'src/services';
import { ILicenseCountAndNodesOnlineResponse } from 'src/types';
import { logger } from 'src/common';

export class LicenseController {
    async getLicenseCount(req: Request, res: Response) {
        let licenseCountAndNodesOnline: ILicenseCountAndNodesOnlineResponse;
        try {
            licenseCountAndNodesOnline = await licenseTypeService.getLicenseTypeCountAndNodesOnline(
                req.body.ctx.user.userId
            );
        } catch (error) {
            logger.error(`rest.fromSiblingBrands.controllers.LicenseTypeCount.getLicenseTypeCount error:${error}`);
            return res.status(500).send();
        }

        res.setHeader('Content-Type', 'application/json');

        res.json(licenseCountAndNodesOnline);
    };
}

export const licenseTypeCountController = new LicenseController();
export default licenseTypeCountController;