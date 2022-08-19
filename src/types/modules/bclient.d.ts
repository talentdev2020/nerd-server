declare module 'bclient' {
  import { EventEmitter } from 'events';
  class Account {
    name: string;
    initialized: true;
    witness: false;
    watchOnly: false;
    type: string;
    m: number;
    n: number;
    accountIndex: number;
    receiveDepth: number;
    changeDepth: number;
    nestedDepth: number;
    lookahead: number;
    receiveAddress: string;
    changeAddress: string;
    nestedAddress: string;
    accountKey: string;
    keys: [string];
    balance: {
      tx: number;
      coin: number;
      unconfirmed: number;
      confirmed: number;
    };
  }

  class Address {
    name: string;
    account: number;
    branch: number;
    index: number;
    witness: boolean;
    nested: boolean;
    publicKey: string;
    script?: string;
    program?: string;
    type: string;
    address: string;
  }

  class Coin {
    version: number;
    height: number;
    value: number;
    script: string;
    address: string;
    coinbase: boolean;
    hash: string;
    index: number;
  }

  class Info {
    network: string;
    wid: number;
    id: string;
    watchOnly: boolean;
    accountDepth: number;
    token: string;
    tokenDepth: number;
    master: {
      encrypted: true;
      until: number;
      iv: string;
      algorithm: string;
      n: number;
      r: number;
      p: number;
    };
    balance: {
      tx: number;
      coin: number;
      unconfirmed: number;
      confirmed: number;
    };
  }

  class SuccessResult {
    success: boolean;
  }

  class Transaction {
    hash: string;
    height: number;
    block: string;
    time: number;
    mtime: number;
    date: string;
    mdate: string;
    size: number;
    virtualSize: number;
    fee: number;
    rate: number;
    confirmations: number;
    inputs: InputOutput[];
    outputs: InputOutput[];
    tx: string;
  }

  interface Path {
    name: string;
    account: number;
    change: boolean;
    derivation: string;
  }

  interface InputOutput {
    value: number;
    address: string;
    userId?: string;
    path?: Path;
    poolType?: string;
  }

  class TransactionOptions {
    account?: string;
    passphrase: string;
    rate?: number;
    address: string;
    value: number;
    subtractFee?: boolean;
  }

  class TransactionMultiOptions {
    account?: string;
    passphrase: string;
    rate?: number;
    outputs: InputOutput[];
    subtractFee?: boolean;
  }

  class Wallet extends EventEmitter {
    public id: string;
    public passPhrase: string;
    /**
     * Create a wallet client.
     * @param {Object?} options
     */

    constructor(parent: any, id: string, token: string);

    /**
     * Open wallet.
     * @returns {Promise}
     */

    open(): Promise<void>;

    /**
     * Close wallet.
     * @returns {Promise}
     */

    close(): Promise<void>;

    /**
     * Get wallet transaction history.
     * @param {String} account
     * @returns {Promise}
     */

    getHistory(account?: string): Promise<Transaction[]>;

    /**
     * Get wallet coins.
     * @param {String} account
     * @returns {Promise}
     */

    getCoins(account: string): Promise<Coin[]>;

    /**
     * Get all unconfirmed transactions.
     * @param {String} account
     * @returns {Promise}
     */

    getPending(account?: string): Promise<Transaction[]>;
    /**
     * Calculate wallet balance.
     * @param {String} account
     * @returns {Promise}
     */

    getBalance(
      account?: string,
    ): Promise<{
      account: number;
      tx: number;
      coin: number;
      unconfirmed: number;
      confirmed: number;
    }>;

    /**
     * Get last N wallet transactions.
     * @param {String} account
     * @param {Number} limit - Max number of transactions.
     * @returns {Promise}
     */

    getLast(account: number, limit: number): Promise<Transaction[]>;

    /**
     * Get wallet transactions by timestamp range.
     * @param {String} account
     * @param {Object} options
     * @param {Number} options.start - Start time.
     * @param {Number} options.end - End time.
     * @param {Number?} options.limit - Max number of records.
     * @param {Boolean?} options.reverse - Reverse order.
     * @returns {Promise}
     */

    getRange(
      account?: string,
      options?: {
        start?: number;
        end?: number;
        limit?: number;
        reverse?: boolean;
      },
    ): Promise<Transaction[]>;

    /**
     * Get transaction (only possible if the transaction
     * is available in the wallet history).
     * @param {Hash} hash
     * @returns {Promise}
     */

    getTX(hash: string): Transaction;

    /**
     * Get wallet blocks.
     * @param {Number} height
     * @returns {Promise}
     */

    getBlocks(): Promise<number[]>;

    /**
     * Get wallet block.
     * @param {Number} height
     * @returns {Promise}
     */

    getBlock(height: number): Promise<number>;

    /**
     * Get unspent coin (only possible if the transaction
     * is available in the wallet history).
     * @param {Hash} hash
     * @param {Number} index
     * @returns {Promise}
     */

    getCoin(hash: string, index: number): Promise<Coin>;
    /**
     * @param {Number} now - Current time.
     * @param {Number} age - Age delta.
     * @returns {Promise}
     */

    zap(account: string, age: number): Promise<SuccessResult>;

    /**
     * Create a transaction, fill.
     * @param {Object} options
     * @returns {Promise}
     */

    createTX(
      options?: TransactionOptions | TransactionMultiOptions,
    ): Promise<Transaction>;

    /**
     * Create a transaction, fill, sign, and broadcast.
     * @param {Object} options
     * @param {String} options.address
     * @param {Amount} options.value
     * @returns {Promise}
     */

    send(
      options?: TransactionOptions | TransactionMultiOptions,
    ): Promise<Transaction>;

    /**
     * Sign a transaction.
     * @param {Object} options
     * @returns {Promise}
     */

    sign(options?: { tx: string; passphrase: string }): Promise<Transaction>;

    /**
     * Get the raw wallet JSON.
     * @returns {Promise}
     */

    getInfo(): Promise<Info>;

    /**
     * Get wallet accounts.
     * @returns {Promise} - Returns Array.
     */

    getAccounts(): Promise<string[]>;

    /**
     * Get wallet master key.
     * @returns {Promise}
     */

    getMaster(): Promise<any>;

    /**
     * Get wallet account.
     * @param {String} account
     * @returns {Promise}
     */

    getAccount(account: string): Promise<Account>;

    /**
     * Create account.
     * @param {String} name
     * @param {Object} options
     * @returns {Promise}
     */

    createAccount(
      name: string,
      options: {
        passphrase: string;
        name?: string;
        witness?: boolean;
        accountKey?: string;
        type?: 'multisig' | 'pubkeyhash';
        m?: number;
        n?: number;
      },
    ): Promise<Account>;

    /**
     * Create address.
     * @param {Object} options
     * @returns {Promise}
     */

    createAddress(account: string): Promise<Address>;

    /**
     * Create change address.
     * @param {Object} options
     * @returns {Promise}
     */

    createChange(account: string): Promise<Address>;

    /**
     * Create nested address.
     * @param {Object} options
     * @returns {Promise}
     */

    createNested(account: string): Promise<Address>;

    /**
     * Change or set master key`s passphrase: string.
     * @param {String|Buffer} passphrase: string
     * @param {(String|Buffer)?} old
     * @returns {Promise}
     */

    setPassphrase(passphrase: string, old: string): Promise<SuccessResult>;

    /**
     * Generate a new token.
     * @param {(String|Buffer)?} passphrase: string
     * @returns {Promise}
     */

    retoken(
      passphrase: string,
    ): Promise<{
      token: string;
    }>;

    /**
     * Import private key.
     * @param {Number|String} account
     * @param {String} key
     * @returns {Promise}
     */

    importPrivate(
      account: string,
      privateKey: string,
      passphrase: string,
    ): Promise<string>;

    /**
     * Import public key.
     * @param {Number|String} account
     * @param {String} key
     * @returns {Promise}
     */

    importPublic(account: string, publicKey: string): Promise<string>;

    /**
     * Import address.
     * @param {Number|String} account
     * @param {String} address
     * @returns {Promise}
     */

    importAddress(account: string, address: string): Promise<SuccessResult>;

    /**
     * Lock a coin.
     * @param {String} hash
     * @param {Number} index
     * @returns {Promise}
     */

    lockCoin(hash: string, index: string | number): Promise<SuccessResult>;

    /**
     * Unlock a coin.
     * @param {String} hash
     * @param {Number} index
     * @returns {Promise}
     */

    unlockCoin(hash: string, index: string | number): Promise<SuccessResult>;
    /**
     * Get locked coins.
     * @returns {Promise}
     */

    getLocked(): Promise<
      [
        {
          hash: string;
          index: number;
        }
      ]
    >;

    /**
     * Lock wallet.
     * @returns {Promise}
     */

    lock(): Promise<SuccessResult>;

    /**
     * Unlock wallet.
     * @param {String} passphrase: string
     * @param {Number} timeout
     * @returns {Promise}
     */

    unlock(passphrase: string, timeout: number): Promise<SuccessResult>;

    /**
     * Get wallet key.
     * @param {String} address
     * @returns {Promise}
     */

    getKey(address: string): Promise<Address>;

    /**
     * Get wallet key WIF dump.
     * @param {String} address
     * @param {String?} passphrase: string
     * @returns {Promise}
     */

    getWIF(
      address: string,
      passphrase: string,
    ): Promise<{
      privateKey: string;
    }>;

    /**
     * Add a public account key to the wallet for multisig.
     * @param {String} account
     * @param {String} key - Account (bip44) key (base58).
     * @returns {Promise}
     */

    addSharedKey(
      account: string,
      accountKey: string,
    ): Promise<{
      success: boolean;
      addedKey: boolean;
    }>;
    /**
     * Remove a public account key to the wallet for multisig.
     * @param {String} account
     * @param {String} key - Account (bip44) key (base58).
     * @returns {Promise}
     */

    removeSharedKey(
      account: string,
      accountKey: string,
    ): Promise<{
      success: boolean;
      removedKey: boolean;
    }>;

    /**
     * Resend wallet transactions.
     * @returns {Promise}
     */

    resend(): Promise<SuccessResult>;
  }

  class WalletClient {
    constructor(walletOptions: {});

    wallet(name: string, token: string): Wallet;
    open(): Promise<void>;
    join(walletId: string, token: string): Promise<void>;
    bind(event: string, cb: (walletId: string, tx: Transaction) => any): any;
    leave(walletId: string): Promise<void>;
  }

  class NodeClient {
    constructor(nodeOptions: {});

    execute(name: string, params: any[]): Promise<void>;
  }
}
