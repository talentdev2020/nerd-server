import { Router } from 'express';
import { licenseTypeCountController } from '../controllers';
import middlewares from '../middlewares/middlewares';

const router = Router();

router.post(
    '/license/getLicenseCount',
    middlewares.verifyUserToken,
    middlewares.validateBodyForUser,
    middlewares.checkIfUserRelatedIdExist,
    licenseTypeCountController.getLicenseCount,
);

export default router;
