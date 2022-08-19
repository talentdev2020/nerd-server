import { Router } from 'express';
import { cartController } from '../controllers';
import middlewares from '../middlewares/middlewares';

const router = Router();



router.post(
  '/cart/getHeaderReport',
  middlewares.verifyAdminToken,
  cartController.getCartTransactionsHeaderReport,
);
router.post(
  '/cart/getDetailReport',
  middlewares.verifyAdminToken,
  cartController.getCartTransactionsDetailReport,
);
export default router;
