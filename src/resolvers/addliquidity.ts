import { ResolverBase, configAws, logger } from 'src/common';
import { Immutables, State } from 'src/types/ILiquidity';
import { Context } from '../types/context';
import { ethers } from 'ethers';
import {
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
} from '@uniswap/v3-sdk';
import {
  Percent,
  Token,
  //CurrencyAmount
} from '@uniswap/sdk-core';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { abi as IUniswapV3FactoryABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import { UniswapPair } from 'simple-uniswap-sdk';
import EthWallet from '../wallet-api/coin-wallets/eth-wallet';


class LiquidityResolver extends ResolverBase {
  poolAddress = async (
    parent: any,
    args: {
      token0: string;
      decimalPlaces0: number;
      token1: string;
      decimalPlaces1: number;
      fee: number;
      amountToken0: string;
      amountToken1: string;
      walletPassword: string;
      initialPrice: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const walletApi = wallet.coin('ETH') as EthWallet;
    const { receiveAddress } = await walletApi.getWalletInfo(user);
    try {
      let passwordDecripted;
      try {
        const encryptedKey = await walletApi.getEncryptedPrivKey(user.userId);
        const decryptedPrivateKey = this.decrypt(
          encryptedKey,
          args.walletPassword,
        );
        const { decryptedString } = decryptedPrivateKey;
        passwordDecripted = decryptedString;
      } catch (e) {
        logger.warn('EncryptedKey no return instead we reach a 401 status' + e);
      }

      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const gasPrice = provider.getGasPrice();

      const token0 = new Token(configAws.chainId, args.token0, args.decimalPlaces0);

      const token1 = new Token(configAws.chainId, args.token1, args.decimalPlaces1);

      const ethersWallet = new ethers.Wallet(passwordDecripted);
      const account = ethersWallet.connect(provider);

      const factoryContract = new ethers.Contract(
        '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        IUniswapV3FactoryABI,
        account,
      );

      let txPool;
      try {
        const createPool = await factoryContract.createPool(
          token0.address,
          token1.address,
          500,
          { gasPrice: gasPrice, gasLimit: 1000000 },
        );
        txPool = await createPool.wait();
      } catch (error) {
        logger.warn(
          'FactoryContract error create Pool address' + error.message,
        );
      }

      let poolAddress;
      if (txPool === undefined) {
        try {
          poolAddress = await factoryContract.getPool(
            token0.address,
            token1.address,
            500,
          );
        } catch (error) {
          logger.warn('FactoryContract get pool error' + error.message);
        }
      }

      const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI,
        account,
      );

      const slot = await poolContract.slot0();
      const PoolState: State = {
        liquidity: await poolContract.liquidity(),
        sqrtPriceX96: slot[0],
        tick: slot[1],
        observationIndex: slot[2],
        observationCardinality: slot[3],
        observationCardinalityNext: slot[4],
        feeProtocol: slot[5],
        unlocked: slot[6],
      };

      const liquidity = await poolContract.liquidity();
      const priceInitializer = ethers.BigNumber.from(1);

      let tx;
      let receipt;
      try {
        tx = await poolContract.initialize(priceInitializer, {
          gasPrice: gasPrice,
          gasLimit: 1000000,
        });
        receipt = await tx.wait();
      } catch (e) {
        logger.warn(
          'The pool already exists, the fee is invalid, or the token arguments are invalid.',
        );
      }

      const immutables: Immutables = {
        factory: await poolContract.factory(),
        token0: await poolContract.token0(),
        token1: await poolContract.token1(),
        fee: await poolContract.fee(),
        tickSpacing: await poolContract.tickSpacing(),
        maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
      };

      let txMint;
      let receiptMint;
      try {
        txMint = await poolContract.mint(
          receiveAddress,
          nearestUsableTick(PoolState.tick, immutables.tickSpacing) -
            immutables.tickSpacing * 2,
          nearestUsableTick(PoolState.tick, immutables.tickSpacing) +
            immutables.tickSpacing * 2,
          liquidity.mul(2).div(1000),
          { gasPrice: gasPrice, gasLimit: 1000000 },
        );
        receiptMint = await txMint.wait();
      } catch (error) {
        logger.warn("can't mint position" + error.message);
      }

      const block = await provider.getBlock(provider.getBlockNumber());
      const deadline = block.timestamp + 200;

      //create a pool
      const NEW_POOL = new Pool(
        token0,
        token1,
        immutables.fee,
        PoolState.sqrtPriceX96.toString(),
        PoolState.liquidity.toString(),
        PoolState.tick,
      );

      // const position = new Position({
      //   pool: NEW_POOL,
      //   liquidity: PoolState.liquidity.mul(2).div(1000).toString(),
      //   tickLower: nearestUsableTick(PoolState.tick, immutables.tickSpacing) - immutables.tickSpacing * 2,
      //   tickUpper: nearestUsableTick(PoolState.tick, immutables.tickSpacing) + immutables.tickSpacing * 2
      // })

      const exampleType = 0;
      // Example 0: Setting up calldata for minting a Position
      // if (exampleType == 0) {
      //   const all = NonfungiblePositionManager.addCallParameters(position, {
      //     slippageTolerance: new Percent(50, 10_000),
      //     recipient: receiveAddress,
      //     deadline: deadline
      //   });
      //   console.log(all)
      // }

      return {
        poolAddress: poolAddress,
        // price0,
        // price1,
      };
    } catch (error) {
      throw new Error('Resolver.LiquidityResolver.poolAddress ' + error);
    }
  };

  addLiquidity = async (
    parent: any,
    args: {
      startingPrice: string;
      minPrice: string;
      maxPrice: string;
      amountToken0: string;
      amountToken1: string;
      walletPassword: string;
    },
    { user, wallet }: Context,
  ) => {
    try {
      return {
        message: 'Success',
      };
    } catch (error) {
      throw new Error('Resolver.LiquidityResolver.addliquidity ' + error);
    }
  };
}

export const liquidityResolver = new LiquidityResolver();

export default {
  Mutation: {
    createPosition: liquidityResolver.poolAddress,
    addLiquidity: liquidityResolver.addLiquidity,
  },
};
