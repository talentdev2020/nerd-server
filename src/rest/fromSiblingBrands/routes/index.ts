import { Router, json } from 'express';
import cartRouter from './cart';
import licenseRouter from './licenseTypeCount';

const router = Router();
router.use('/', json());
router.use('/', cartRouter);
router.use('/', licenseRouter);
export const siblingBrandsRouter = router;
export default router;
