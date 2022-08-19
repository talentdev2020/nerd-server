import admin from 'firebase-admin';
import { ServerAuth } from '@blockbrothers/firebasebb';

interface IArgsUser {
  email: string;
  password?: string;
  displayName?: string;
}

interface IUserInfo {
  email?: string;
  password?: string;
  emailVerified?: boolean;
}

interface IOptions {
  ignoreExpiration?: boolean;
}

const firebaseUser: Partial<admin.auth.UserRecord> = {
  email: 'user@test.com',
  uid: 'uid',
};

export default function create(token: string, userId: string): ServerAuth {
  const claims = {
    permissions: [
      'VIEW_API',
      'EDIT_OWN_ACCOUNT',
      'VIEW_ONEVIEW',
      'VIEW_PROTIPS',
      'VIEW_ROBOT',
    ],
    role: 'member',
    userId: userId,
    authorized: true,
    twoFaEnabled: false,
    prop: '',
  };

  const decodedToken = {
    aud: '',
    iat: 0,
    exp: 0,
    iss: '',
    sub: '',
    uid: '',
    claims: claims,
    userId: userId,
  };

  const auth: Partial<ServerAuth> = {
    createFirebaseUser: (user: IArgsUser, domain: string) =>
      Promise.resolve(firebaseUser as admin.auth.UserRecord),
    getFirebaseUid: (firebaseToken: string, domain: string) =>
      Promise.resolve('testid'),
    getUser: async (uid: string, domain: string) =>
      firebaseUser as admin.auth.UserRecord,
    signIn: async (firebaseToken: string, domain: string) => token,
    signInAfterRegister: async (firebaseUid: string, domain: string) => token,
    updateDisplayName: async (
      firebaseUid: string,
      domain: string,
      displayNameNew: string,
    ) => {},
    updateUserAuth: async (
      firebaseUid: string,
      userInfo: IUserInfo,
      domain: string,
    ) => firebaseUser as admin.auth.UserRecord,
    verifyAndDecodeToken: (token: string, domain: string, options?: IOptions) =>
      decodedToken,
  };

  return auth as ServerAuth;
}
