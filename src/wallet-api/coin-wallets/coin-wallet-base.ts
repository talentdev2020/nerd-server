// This abstract class is intended to provide a framework for each of the wallet interfaces to ensure they implement the same methods and return the same data shape
import { ITransaction, ICartAddress, ICartBalance } from 'src/types';
import { UserApi } from 'src/data-sources';
import { crypto } from 'src/utils';
import { credentialService } from 'src/services';
import { TxSendResponse } from 'src/types/ITransaction';

const BTC_RESOURCE = 'xprivkey';
const ETH_RESOURCE = 'privatekey';

export default abstract class CoinWalletBase {
  constructor(
    protected name: string,
    public symbol: string,
    public contractAddress: string,
    protected abi: any,
    protected backgroundColor: string,
    protected icon: string,
    protected decimalPlaces: number,
  ) {
    if (!name)
      throw new Error(
        'No name provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!symbol)
      throw new Error(
        'No symbol provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!backgroundColor)
      throw new Error(
        'No backgroundColor provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!icon)
      throw new Error(
        'No icon provided in token configuration for wallet interface. This parameter is required.',
      );
  }

  abstract getWalletInfo(
    userApi: UserApi,
  ): Promise<{
    receiveAddress: string;
    symbol: string;
    name: string;
    icon: string;
    backgroundColor: string;
    canSendFunds: boolean;
    lookupTransactionsBy: string | UserApi;
    decimalPlaces: number;
  }>;

  abstract getBalance(
    addressOrUserApi: string | UserApi,
  ): Promise<{
    confirmed: string;
    unconfirmed: string;
  }>;

  abstract checkIfWalletExists(user: UserApi): Promise<boolean>;

  abstract getTransactions(
    addressOrUserApi: string | UserApi,
    blockNumberAtCreation?: number,
  ): Promise<ITransaction[]>;

  abstract estimateFee(
    userApi: UserApi,
  ): Promise<{
    estimatedFee: string;
    feeCurrency: string;
    feeCurrencyBalance: string;
  }>;

  abstract send(
    userApi: UserApi,
    outputs: { to: string; amount: string }[],
    walletPassword: string,
  ): Promise<TxSendResponse>;

  abstract createWallet(
    user: UserApi,
    walletPassword: string,
    recoveryPhrase: string,
  ): Promise<boolean>;

  abstract recoverWallet(
    user: UserApi,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean>;
  abstract checkPassword(user: UserApi, password: string): Promise<boolean>;
  abstract getCartAddress(
    symbol: string,
    orderId: string,
    amount: string,
  ): Promise<ICartAddress>;
  abstract getCartBalance(
    symbol: string,
    orderId: string,
    address: string,
  ): Promise<ICartBalance>;

  protected encrypt = (plainText: string, secret: string) =>
    crypto.encrypt(plainText, secret);

  protected decrypt = (encryptedText: string, secret: string) =>
    crypto.decrypt(encryptedText, secret);

  protected hash = (value: string) => crypto.hash(value);

  public getEncryptedPrivKey = async (userId: string) => {
    let symbol = this.symbol;

    if (this.contractAddress) {
      symbol = 'ETH';
    }

    const resource = symbol === 'BTC' ? BTC_RESOURCE : ETH_RESOURCE;

    const encryptedKey = await credentialService.get(userId, symbol, resource);

    return encryptedKey;
  };
}
