import { Request, Response } from 'express';
import { prizeoutService } from '../../services/';

class PrizeoutNotificationController {
  public async postBalance(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/json');
    const { partner_user_id, giftcard_cost } = req.body;

    const {
      balance,
      hasSufficientBalance,
    } = await prizeoutService.isBalanceAvailable(
      partner_user_id,
      giftcard_cost,
    );

    res.status(hasSufficientBalance ? 200 : 480);
    return res.json(balance);
  }

  public async postSuccess(req: Request, res: Response) {
    const { giftcard_cost } = req.body;

    await prizeoutService.prizeoutSuccess(giftcard_cost);
    return res.sendStatus(200);
  }

  public async postFailure(req: Request, res: Response) {
    const { giftcard_cost } = req.body;

    await prizeoutService.prizeoutFailure(giftcard_cost);
    return res.sendStatus(200);
  }

  public async postRejected(req: Request, res: Response) {
    const { giftcard_cost } = req.body;

    await prizeoutService.prizeoutRejection(giftcard_cost);
    return res.sendStatus(200);
  }
}

export default new PrizeoutNotificationController();
