import { generateMnemonic, wordlists, validateMnemonic } from 'bip39';
import { logger } from '../common';

class Mnemonic {
  private getWordlist(lang: string) {
    logger.debug(`utils.mnemonic.getWordList.lang: ${lang}`);
    switch (lang) {
      case 'en': {
        return wordlists.english;
      }
      case 'ja': {
        return wordlists.japanese;
      }
      case 'ko': {
        return wordlists.korean;
      }
      case 'zh_HANS': {
        return wordlists.chinese_simplified;
      }
      case 'zh_HANT': {
        return wordlists.chinese_traditional;
      }
      case 'fr': {
        return wordlists.french;
      }
      case 'it': {
        return wordlists.italian;
      }
      case 'es': {
        return wordlists.spanish;
      }
      default: {
        throw new Error(
          'No language specificed for word list, or language not supported.',
        );
      }
    }
  }

  public generateRandom(lang: string = 'en') {
    logger.debug(`utils.mnemonic.generateRandom.lang: ${lang}`);
    const wordList = this.getWordlist(lang);
    return generateMnemonic(undefined, undefined, wordList);
  }

  public validate(mnemonic: string, lang: string = 'en') {
    logger.debug(`utils.mnemonic.validate.lang: ${lang}`);
    logger.debug(`utils.mnemonic.validate.!!mnemonic: ${!!mnemonic}`);
    const wordList = this.getWordlist(lang);
    const isValid = validateMnemonic(mnemonic, wordList);
    logger.debug(`utils.mnemonic.validate.isValid: ${isValid}`);
    return isValid;
  }
}

export default new Mnemonic();
