import { IncomingMessage, ServerResponse } from 'http';
import { ClientAuth } from '@blockbrothers/firebasebb';
import { auth, config, configAws } from '../common';
import { IUser, User } from '../models';
import { IFirebaseClient } from '../types';

// TODO: move me
interface ApolloContext {
  req: IncomingMessage;
  res: ServerResponse;
}

class Iam {}


const AUTH_APP_DOMAIN: string = config.hostname;

const IamAuthenticateResponse = {
  async principal(root: any, args: any, ctx: ApolloContext) {
    if (!root) {
      return null;
    }

    const { metadata, token }: any = root || {};
    if (!metadata || !metadata.uid) {
      console.warn(__filename, 'Danger: need to have user id?');
      return null;
    }
    // TODO : everything in the mongoUser and the User.findone should be in this verifyIdToken. need to match up all the fields here to make sure
    // full coverage. Then we don't need a round-trip to DB to get this info 20 lines below here
    // if(token) {
    //   const {
    //     permissions,
    //     role,
    //     userId,
    //     authorized,
    //     twoFaEnabled,
    //   } = await auth.verifyIdToken(token, AUTH_APP_DOMAIN);

    // }

    let user;
    let permissions = [];
    try {
      user = await auth.getUser(metadata.uid, AUTH_APP_DOMAIN);
      if (!user) {
        throw new Error('No user profile could be found.');
      }
      const mongoUser: IUser = await User.findOne({ firebaseUid: user.uid });
      permissions = mongoUser?.permissions;
    } catch (err) {
      throw new Error(
        `Could not find user by uid=${metadata.uid}: ${err.message}`,
      );
    }

    return {
      ...user,
      permissions,
    };
  },
};

const IamOps = {
  async authenticate(
    root: any,
    args: { input: { username: string; password: string } },
    ctx: ApolloContext,
  ) {
    const { username, password } = args.input;
    const FIREBASE_CLIENT_INFO: IFirebaseClient = configAws.firebaseClientInfo;
    const client = new ClientAuth({
      apiKey: FIREBASE_CLIENT_INFO.ApiKey,
      authDomain: FIREBASE_CLIENT_INFO.AuthDomain,
      projectId: FIREBASE_CLIENT_INFO.ProjectId,
    });

    let success = false;
    let message = null;
    const metadata: any = {};

    let authentication;
    try {
      const fbAuth = await client.signIn(username, password);
      const token = await auth.signIn(fbAuth, AUTH_APP_DOMAIN);
      if (token) {
        authentication = {
          token,
          type: 'Bearer',
        };
      }

      const uid = await auth.getFirebaseUid(fbAuth, AUTH_APP_DOMAIN);
      if (uid) {
        metadata.uid = uid;
      }
      // const user = await auth.getUser(fbAuth, AUTH_APP_DOMAIN)
      // console.log({ fbAuth, ours, uid })
      message = 'Success!';
      success = true;
    } catch (err) {
      console.warn('Failed authentication attemp', err);
      message = err.message;
    }

    return {
      authentication,
      success,
      message,
      metadata,
    };
  },
  async authenticate_with_token(
    root: any,
    args: { input: { token: string; } },
    ctx: ApolloContext,
  ) {
    const { token: jwtToken } = args.input;

    let success = false;
    let message = null;
    const metadata: any = {};

    let authentication;
    try {
    const decoded = await auth.signInWithJWT(jwtToken, AUTH_APP_DOMAIN) as {token: string, uid: string};
      if (!decoded) {
        throw(new Error("Invalid token"));
      };

      const { token, uid } = decoded;
      authentication = {
        token: token,
        type: 'Bearer',
      };
      metadata.uid = uid;
      message = 'Success!';
      success = true;
    } catch (err) {
      console.warn('Failed authentication attemp', err);
      message = err.message;
    }

    return {
      authentication,
      success,
      message,
      metadata,
    };
  },
};

export default {
  Iam,
  IamOps,
  IamAuthenticateResponse,
  Query: {
    iam: () => ({}),
  },
  Mutation: {
    iam: () => ({}),
  },
};
