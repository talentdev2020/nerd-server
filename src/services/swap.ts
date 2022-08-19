import { ServerToServerService } from './server-to-server';
import ethers = require('ethers');
import { UniswapPair, ETH, TradeContext } from 'simple-uniswap-sdk';
import * as IUniswapV2Router from 'simple-uniswap-sdk/dist/esm/ABI/uniswap-router-v2.json';
import { configAws } from '../common';
import { utils } from 'ethers';

const chainId = configAws.chainId;

let network: string;
if (chainId === 1) {
  network = ETH.MAINNET().contractAddress;
} else if (chainId === 3) {
  network = ETH.ROPSTEN().contractAddress;
}

class StartSwap extends ServerToServerService {
  uniswapV2RouterInterface = new utils.Interface(IUniswapV2Router);

  public confirmSwap = async (
    decryptedString: string,
    inputToken: string,
    outputToken: string,
    amount: string,
    receiveAddress: string,
  ) => {
    try {
      const {
        trade,
        uniswapPairFactory,
        message,
        functionName,
      } = await this.uniswapSwap(
        inputToken,
        outputToken,
        amount,
        receiveAddress,
      );

      const {
        minAmountConvertQuote,
        expectedConvertQuote,
        routeText,
        liquidityProviderFee,
        liquidityProviderFeePercent,
        tradeExpires,
      } = trade;

      if (message !== 'Success') {
        throw new Error(message);
      }

      if (!trade.fromBalance.hasEnough) {
        throw new Error('You do not enough balance to execute this swap');
      }

      const provider = new ethers.providers.JsonRpcProvider(
        uniswapPairFactory.providerUrl,
      );

      const wallet = new ethers.Wallet(decryptedString, provider);
      const contract = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        IUniswapV2Router as any,
        wallet,
      );

      const txs = contract.filters;

      const {
        hash,
        blockNumber,
        confirmations,
        to,
      } = await this.firmAndSendSwap(trade, wallet, functionName);

      return {
        message: 'Success',
        hash,
        blockNumber,
        confirmations,
        to,
        midPrice: minAmountConvertQuote,
        midPriceInverted: expectedConvertQuote,
        path: routeText,
        liquidityProviderFee,
        liquidityProviderFeePercent,
        tradeExpires,
      };
    } catch (error) {
      return {
        message: error.message,
        hash: '',
        blockNumber: 0,
        confirmations: 0,
        to: '',
        midPrice: '',
        midPriceInverted: '',
        path: '',
        liquidityProviderFee: '',
        liquidityProviderFeePercent: 0,
        tradeExpires: 0,
      };
    }
  };

  private firmAndSendSwap = async (
    swap: TradeContext,
    wallet: ethers.ethers.Wallet,
    functionName: string,
    toUserId?: string,
  ) => {
    if (swap.approvalTransaction) {
      try {
        const approved = await wallet.sendTransaction(swap.approvalTransaction);
        console.log('approved txHash', approved.hash);
        const approvedReceipt = await approved.wait();
        console.log('approved receipt', approvedReceipt);
      } catch (error) {
        throw new Error('Service.Swap.SartSwap.FirmAndSend.error' + error);
      }
    }

    try {
      const txResponse = await wallet.sendTransaction(swap.transaction);
      const { data, gasPrice, nonce, value } = txResponse;

      console.log('trade txHash', txResponse.hash);
      const tradeReceipt = await txResponse.wait();
      console.log('trade receipt', tradeReceipt);
      const confirmations: number = tradeReceipt.confirmations;
      const to: string = tradeReceipt.to;
      const hash: string = txResponse.hash;
      const blockNumber: number = tradeReceipt.blockNumber;

      swap.destroy();
      return {
        message: 'Success',
        hash,
        blockNumber,
        confirmations,
        to,
      };
    } catch (error) {
      throw new Error('Service.Swap.SartSwap.FirmAndSend.error' + error);
    }
  };

  public uniswapSwap = async (
    inputToken: string,
    outputToken: string,
    amount: string,
    receiveAddress: string,
  ) => {
    let functionName = '';
    const isOEth = network.toLowerCase().includes(outputToken);
    const isIEth = network.toLowerCase().includes(inputToken);

    if (isIEth) {
      functionName = 'swapExactETHForTokens';
      try {
        const uniswapPair = new UniswapPair({
          fromTokenContractAddress: network,
          toTokenContractAddress: outputToken,
          ethereumAddress: receiveAddress,
          chainId: chainId,
        });
        const uniswapPairFactory = await uniswapPair.createFactory();
        const trade = await uniswapPairFactory.trade(amount);

        return {
          message: 'Success',
          uniswapPair,
          uniswapPairFactory,
          trade,
          functionName,
        };
      } catch (error) {
        throw new Error(
          'Service.Swap.SartSwap.uniswapSwap.isIEth.error' + error,
        );
      }
    }

    if (isOEth) {
      functionName = 'swapExactTokensForETH';
      try {
        const uniswapPair = new UniswapPair({
          fromTokenContractAddress: inputToken,
          toTokenContractAddress: network,
          ethereumAddress: receiveAddress,
          chainId: chainId,
        });
        const uniswapPairFactory = await uniswapPair.createFactory();
        const trade = await uniswapPairFactory.trade(amount);

        return {
          message: 'Success',
          uniswapPair,
          uniswapPairFactory,
          trade,
          functionName,
        };
      } catch (error) {
        throw new Error(
          'Service.Swap.SartSwap.uniswapSwap.isOEth.error' + error,
        );
      }
    }

    functionName = 'swapExactTokensForTokens';
    try {
      const uniswapPair = new UniswapPair({
        fromTokenContractAddress: inputToken,
        toTokenContractAddress: outputToken,
        ethereumAddress: receiveAddress,
        chainId: chainId,
      });
      const uniswapPairFactory = await uniswapPair.createFactory();
      const trade = await uniswapPairFactory.trade(amount);

      return {
        message: 'Success',
        uniswapPair,
        uniswapPairFactory,
        trade,
        functionName,
      };
    } catch (error) {
      throw new Error('Service.Swap.SartSwap.uniswapSwap.Tokens.error' + error);
    }
  };
}

export const startSwap = new StartSwap();
