import { configAws, logger } from '../common';
const SimpleCrypto = require('simple-crypto-js').default;
const LegacySimpleCrypto = require('@blockbrothers/legacy-simple-crypto')
  .default;
import { MD5, enc, SHA256 } from 'crypto-js';

class Crypto {
  public ERROR_INCORRECT_SECRET = 'Incorrect password';
  enc = enc;
  MD5 = MD5;
  public encrypt = (plainText: string, secret: string) => {
    logger.debug(
      `utils.crypto.encrypt.config.clientSecretKeyRequired:${configAws.clientSecretKeyRequired}`,
    );
    if (!configAws.clientSecretKeyRequired) return plainText;
    logger.debug('utils.crypto.encrypt:encrypting');
    const simpleCrypto = new SimpleCrypto(secret);
    return simpleCrypto.encrypt(plainText).toString();
  };

  public decrypt = (
    encryptedText: string,
    secret: string,
  ): {
    decryptedString: string;
    version: string;
    reEncryptedString?: string;
  } => {
    logger.debug(
      `utils.crypto.decrypt.config.clientSecretKeyRequired:${configAws.clientSecretKeyRequired}`,
    );
    if (!configAws.clientSecretKeyRequired) {
      return {
        decryptedString: encryptedText,
        version: 'N/A',
      };
    }
    logger.debug('utils.crypto.decrypt:decrypting');
    try {
      const decryptedString = new LegacySimpleCrypto(secret)
        .decrypt(encryptedText)
        .toString();
      if (decryptedString) {
        return {
          decryptedString,
          version: '2.0.2',
          reEncryptedString: this.encrypt(decryptedString, secret),
        };
      } else {
        throw new Error(this.ERROR_INCORRECT_SECRET);
      }
    } catch (error) {
      try {
        const decryptedString = new SimpleCrypto(secret)
          .decrypt(encryptedText)
          .toString();
        if (!decryptedString) {
          throw new Error(this.ERROR_INCORRECT_SECRET);
        }
        return {
          decryptedString,
          version: '2.5.0',
        };
      } catch (err) {
        logger.error(`utils.crypto.decrypt: ${err.stack}`);

        throw new Error(this.ERROR_INCORRECT_SECRET);
      }
    }
  };

  public hash = (value: string) => {
    logger.debug('utils.crypto.hash');
    return SHA256(value).toString();
  };
}

export const crypto = new Crypto();
