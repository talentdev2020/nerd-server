import { ClientAuth } from '@blockbrothers/firebasebb';
import authResolver from '../src/resolvers/auth';
import { walletApi } from '../src/wallet-api';
import { Context } from '../src/types/context';

export const auth = new ClientAuth({
  apiKey: process.env.FIREBASE_CLIENT_API_KEY,
  authDomain: process.env.FIREBASE_CLIENT_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_CLIENT_PROJECT_ID,
});

void (async () => {
  try {
    const args = process.argv;
    // grab the value just after the '-e' and '-p' argument
    const emailIdx = args.findIndex(arg => arg === '-e');
    const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
    const passwordIdx = args.findIndex(arg => arg === '-p');
    const password = passwordIdx >= 0 ? args[passwordIdx + 1] : undefined;
    if (email == undefined || password == undefined) {
      console.log("usage: npm gen-jwt -- -e 'email' -p 'password'");
      process.exit(0);
    }

    const firebaseToken = await auth.signIn(email, password);
    const context: Context = {
      req: null,
      res: null,
      dataSources: null,
      user: null,
      wallet: walletApi,
      logger: null,
    };

    await sleep(2000);

    console.log('=====================firebaseToken=======================');
    console.log(firebaseToken);
    console.log('=====================firebaseToken=======================');

    const { token } = await authResolver.Mutation.login(
      null,
      { token: firebaseToken },
      context,
    );
    console.log('=====================JWT TOKEN=======================');
    console.log(token);
    console.log('=====================JWT TOKEN=======================');
    process.exit(0);
  } catch (error) {
    console.log('Failed to generate token:');
    console.log(error);
    process.exit(1);
  }
})();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
