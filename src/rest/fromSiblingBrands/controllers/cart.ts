import { Request, Response } from 'express';
import { cartService } from 'src/services';
import { ICartTransactionsReportDetail, ICartTransactionsReportHeaderResponse } from 'src/types';
import { logger } from 'src/common';

export class Controller {
  async getCartTransactionsHeaderReport(req: Request, res: Response) {
    if (!req.body?.args)
      return res.status(400).send();

    const { startDate, endDate } = req.body.args;

    if (!startDate || !endDate)
      return res.status(400).send();

    let report: ICartTransactionsReportHeaderResponse;
    try {
      report = await cartService.getAllCartTransactionsHeaderReport(
        startDate,
        endDate,
      );
    } catch (error) {
      logger.error(`rest.fromSiblingBrands.controllers.cart.getCartTransactionsHeaderReport error:${error}`);
      return res.status(500).send();
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(report);
  }

  async getCartTransactionsDetailReport(req: Request, res: Response) {
    if (!req.body?.args)
      return res.status(400).send();

    const { startDate, endDate } = req.body.args;

    if (!startDate || !endDate)
      return res.status(400).send();

    let report: ICartTransactionsReportDetail[];
    try {
      report = await cartService.getAllCartTransactionsDetailReport(
        startDate,
        endDate,
      );
    } catch (error) {
      logger.error(`rest.fromSiblingBrands.controllers.cart.getCartTransactionsDetailReport error:${error}`);
      return res.status(500).send();
    }
    res.setHeader('Content-Type', 'application/json');
    res.json({ cartTransactions: report });
  }
}

export const cartController = new Controller();
export default cartController;