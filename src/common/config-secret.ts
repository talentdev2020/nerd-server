import config from './config';
import logger from './logger/logger';
import { secretsFactory } from 'src/common/secret-providers/secret-factory';
import { Secrets } from 'src/types/secret';

class ConfigSecrets {
  private secrets: Secrets;
  private secretObject: any = {};
  public rewardPrivateKey: string;
  public rewardDistributorKey: string;
  public rewardActionsDistributorEthKey: string;
  public cartBtcWalletName: string;
  public cartBtcWalletPass: string;
  public cartETHWalletMnemonic: string;
  public cartGREENWalletMnemonic: string;
  public cartGALAWalletMnemonic: string;
  public cartEthDeriveAccount: string;
  public claimFeeReceiveAddress: string;
  public companyFeeEthAddress: string;
  public cartKeys: any;
  
  public initialize = async () => {
    try {
      this.secretObject = {};
      const contractKeyAws =`${config.isProd ? 'prod' : 'stage'}/${config.brand}/env/ftKnox`;;
      this.secrets = secretsFactory.getSecretInstance();
      this.secretObject = await this.secrets.getSecretValue(contractKeyAws);

      this.rewardPrivateKey = this.secretObject.reward_pkey;
      this.rewardDistributorKey = this.secretObject.reward_distributor_pkey;
      this.rewardActionsDistributorEthKey = this.secretObject.REWARD_DISTRIBUTOR_ETH_PKEY;
      this.cartBtcWalletName = this.secretObject.CART_BTC_WALLET_NAME;
      this.cartBtcWalletPass = this.secretObject.CART_BTC_WALLET_PASS;
      this.cartETHWalletMnemonic = this.secretObject.CART_ETH_WALLET_MNEMONIC;
      this.cartGREENWalletMnemonic = this.secretObject.CART_GREEN_WALLET_MNEMONIC;
      this.cartGALAWalletMnemonic = this.secretObject.CART_GALA_WALLET_MNEMONIC;
      this.cartEthDeriveAccount = this.secretObject.CART_ETH_DERIVE_ACCOUNT;
      this.claimFeeReceiveAddress = this.secretObject.CLAIM_FEE_RECEIVE_ADDRESS;
      this.companyFeeEthAddress = this.secretObject.COMPANY_FEE_ETH_ADDRESS;
      this.cartKeys = {
        btcWalletName: this.cartBtcWalletName,
        btcWalletToken: this.cartBtcWalletPass,
        btcWalletPass: this.cartBtcWalletPass,
        ethMnemonic: this.getEthMnemonic('ETH'),
        greenMnemonic: this.getEthMnemonic('GREEN'),
        galaMnemonic: this.getEthMnemonic('GALA'),
      };
      console.log(`Secret Config is connected to : ${contractKeyAws}`);
    } catch (err) {
      logger.errorContext('config-secrets.initialize', {"err": err.message});
      console.log('config-secrets.initialize');

      console.log(err);
    }
  };

  public getEthMnemonic(symbol: string): string {
    const envSetting = `CART_${symbol.toUpperCase()}_WALLET_MNEMONIC`;
    return this.secretObject[envSetting];
  }
}

const configSecrets = new ConfigSecrets();
export default configSecrets;
