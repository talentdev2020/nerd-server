import { User } from 'src/models';

class PrizeoutService {
  async isBalanceAvailable(userId: string, giftcardCost: number): Promise<any> {
    // Find the user
    // const user = User.findOne({userId});

    // What's the user's balance
    // const currentBalance = user.iban.Balance;
    const currentBalance = 0;

    const hasSufficientBalance = giftcardCost <= currentBalance;

    // set temporary balance on user
    // set withheld balance on user
    return {
      currentBalance,
      hasSufficientBalance,
    };
  }

  public prizeoutSuccess = async (giftcardCost: number): Promise<void> => {
    // Here we deduct the giftcard cost from the user's iban balance.
    // Maybe we need the payment gateway to transfer these funds?

    // Find the user
    // const user = User.findOne({userId});
    // const currentBalance = user.iban.Balance;
    // const withheldBalance = user.prizeout.withheldBalance;

    // const nextBalance = currentBalance - giftcardCost;

    // set user balance to next balance;
    console.log('Debiting', giftcardCost, 'from user balance');
  };

  public prizeoutFailure = async (giftcardCost: number) => {
    // Find the user
    // const user = User.findOne({userId});
    // const currentBalance = user.iban.Balance;
    // const withheldBalance = user.prizeout.withheldBalance;

    // const nextBalance = currentBalance + withheldBalance;

    // set user balance to next balance;
    console.log('Returning', giftcardCost, 'to user balance');
  };

  public prizeoutRejection = async (giftcardCost: number) => {
    // Find the user
    // const user = User.findOne({userId});
    // const currentBalance = user.iban.Balance;
    // const withheldBalance = user.prizeout.withheldBalance;

    // const nextBalance = currentBalance + withheldBalance;

    // set user balance to next balance;
    console.log('Returning', giftcardCost, 'to user balance');
  };
}

export const prizeoutService = new PrizeoutService();
