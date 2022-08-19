export default (userId: string, transactionId: string) => [
  {
    $match: { userId },
  },
  {
    $project: { _id: 0, cryptoTransactions: 1 },
  },
  {
    $unwind: '$cryptoTransactions',
  },
  {
    $match: { 'cryptoTransactions.transactionId': transactionId },
  },
  {
    $project: {
      'cryptoTransactions.transactionId': 1,
      'cryptoTransactions.referenceId': 1,
      'cryptoTransactions.transactionStatus': 1,
      'cryptoTransactions.amount': 1,
      'cryptoTransactions.depositAddress': 1,
    },
  },
];
