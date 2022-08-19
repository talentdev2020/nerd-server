import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { auth, logger, configAws, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import { UserApi } from 'src/data-sources';
import { User, Template, IUserIds, IUpdateUserIds } from 'src/models';
import { IOrderContext } from 'src/types';
import { careclix, s3Service, userService } from 'src/services';
//import { emailService } from '../data-sources/send-email';
import { sendinblueService } from 'src/data-sources/sendinblue';
import License from 'src/models/license';
import { WalletApi } from 'src/wallet-api';
import { getNextNumber, IUser } from 'src/models/user';
import axios from 'axios';
import { WooUpdateUser } from 'src/types/user';

class Resolvers extends ResolverBase {
  private doesUserAlreadyExist = async (email: string) => {
    try {
      const user = await User.findOne({ email });

      return !!user;
    } catch(error) {
      logger.error("resolvers.user.doesUserAlreadyExist")

      throw error;
    };
  }
   

  private async verifyWalletsExist(user: UserApi, wallet: WalletApi) {
    // logger.debug(`resolvers.auth.verifyWalletsExist.userId:${user.userId}`);
    // ^ commented to limit sentry logs - 10000+ in 90 days

    try {
      const walletsExist = await Promise.all(
        wallet.parentInterfaces.map(parentCoin =>
          parentCoin.checkIfWalletExists(user),
        ),
      );
      // logger.debug(
      //   `resolvers.auth.verifyWalletsExist.walletsExist:${walletsExist}`,
      // );
      // ^ commented to limit sentry logs - 313k + 589 in 90 days
      const bothWalletsExist = walletsExist.every(walletExists => walletExists);
      // logger.debug(
      //   `resolvers.auth.verifyWalletsExist.bothWalletsExist:${bothWalletsExist}`,
      // );
      // ^ commented to limit sentry logs - 519 + 408 + 114 + 3 + 33 + 93 in 90 days
      return bothWalletsExist;
    } catch (error) {
      logger.warn(`resolvers.auth.verifyWalletsExist.catch:${error}`);
      return false;
    }
  }

  private findOrCreateFirebaseUser = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    try {
      const user = await auth.createFirebaseUser(
        { email, password, displayName },
        configAws.hostname,
      );

      return user;
    } catch (error) {
      //Checking if the user happens to exist in firebase already
      const user = await auth.getUserByEmail(email, configAws.hostname);
      if (user) {
        const updatedUser = await auth.updateUserAuth(
          user.uid,
          { password },
          configAws.hostname,
        );

        return updatedUser;
      }

      logger.exceptionContext(
        error,
        'Error when trying to findOrCreateFirebaseUser',
        { email: email },
      );

      const wrappedError: Error = new Error(
        `Error when trying to findOrCreateFirebaseUser : ${error.message} from auth`,
      );
      throw wrappedError;
    }
  };

  public userExists = async (
    parent: any,
    args: { email: string },
    context: Context,
  ) => {
    return await this.doesUserAlreadyExist(args.email);
  };

  public createUser = async (
    parent: any,
    args: {
      userInfo: {
        email?: string;
        password?: string;
        token?: string;
        firstName: string;
        lastName: string;
        displayName: string;
        profilePhotoFilename: string;
        phone: string;
        phoneCountry: string;
        language: string;
        referralContext: IOrderContext;
        communicationConsent: boolean;
        activationTermsAndConditions: {}[];
        gender?: string;
        dateOfBirth?: Date;
        country?: string;
        countryCode?: string;
        countryPhoneCode?: string;
        clinic?: string;
        careclixId?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
      };
      ipAddress: string;
    },
    context: Context,
  ) => {
    const {
      dataSources: { linkShortener, bitly },
      res,
    } = context;    

    const {
      email,
      password,
      token,
      firstName,
      lastName,
      displayName,
      profilePhotoFilename,
      phone = null,
      language,
      referralContext = {},
      communicationConsent,
      activationTermsAndConditions,
      gender,
      dateOfBirth,
      country,
      countryCode,
      countryPhoneCode,
      clinic,
      careclixId,
      street,
      city,
      state,
      zipCode,
    } = args.userInfo;

    const {
      offer,
      referredBy, //affilliateId | customerNumber (=> User.number).
      utm_campaign: utmCampaign = '',
      utm_content: utmContent = '',
      utm_keyword: utmKeyword = '',
      utm_medium: utmMedium = '',
      utm_name: utmName = '',
      utm_source: utmSource = '',
      utm_term: utmTerm = '',
    } = referralContext;

    if (email) {
      const userExists = await this.doesUserAlreadyExist(email);

      if (userExists) {
        throw new Error('Email already exists.');
      }
    }

    if (firstName.length > 30) {
      throw new Error('Error: First name must be 30 characters or less in length');
    } else if (lastName.length > 30) {
      throw new Error('Error: Last name must be 30 characters or less in length');
    }

    if(configAws.supportsDisplayNames){
      try {
        const displayNameValid = await this.checkUniqueDisplayName(displayName);
        if (!displayNameValid) {
          logger.warnContext('Invalid username ', {
            displayName,
            email,
          });

          throw new Error('Display name is taken or invalid');
        }
        
        } catch (err) {
          logger.exceptionContext(
            err,
            'resolvers.auth.createUser.checkUniqueDisplayName failed',
            {
              displayName,
              email,
            },
          );
          throw new Error('Display Name Poorly Sent');
        }
      }
    
    let url: string; 
    try {
      url = `${configAws.wpApiUrl}/bb_iam/v1/user_create_wp`;
      const resp: {
        data: {
          success: 0 | 1;
          message: string;
          wordpressId?: number;
        };
      } = await axios.post(url, null, {
        params: { 
          ApiKey: configAws.wpApiKey, 
          email, 
          firstName, 
          lastName, 
        },
      });

      if (resp.data.success === 0 && resp.data.message !== 'Failed: That email address is already in use.') {
        throw new Error(resp.data.message);
      };
    } catch (err) {
      logger.error(
        `createUser.error : ${err.toString()}`,
      );
      throw err
    };

    let firebaseUser;

    try {
      if (token) {
        const firebaseUid = await auth.getFirebaseUid(
          token,
          configAws.hostname,
        );

        await auth.updateDisplayName(
          firebaseUid,
          configAws.hostname,
          displayName,
        );

        firebaseUser = await auth.getUser(firebaseUid, configAws.hostname);
      } else {
        firebaseUser = await this.findOrCreateFirebaseUser(
          email,
          password,
          displayName,
        );
      }
    } catch (err) {
      logger.exceptionContext(
        err,
        'resolvers.auth.createUser.firebaseStep failed',
        {
          email,
          token,
          displayName,
        },
      );
    }

    if (!firebaseUser) {
      const response_error: {
        twoFaEnabled: boolean;
        token: string;
        walletExists: boolean;
        verificationEmailSent?: boolean;
      } = {
        twoFaEnabled: false,
        token: '',
        walletExists: false,
        verificationEmailSent: false,
      };
      return response_error;
    }

    let termsTemplateId: any = undefined;
    let privacyTemplateId: any = undefined;
    let number: any = undefined;
    let affiliateId: any = undefined;

    try {
      termsTemplateId = await this.getTemplateId('terms-of-service');
      privacyTemplateId = await this.getTemplateId('privacy-policy');
      number = await getNextNumber();
      affiliateId = new Types.ObjectId().toHexString();
    } catch (err) {
      logger.exceptionContext(
        err,
        'resolvers.auth.createUser.gatherDbTemplates failed',
        {
          email,
          termsTemplateId: JSON.stringify(termsTemplateId),
          privacyTemplateId: JSON.stringify(privacyTemplateId),
          number: JSON.stringify(number),
          affiliateId: JSON.stringify(affiliateId),
        },
      );
    }

    let profilePhotoUrl = '';
    let realReferredId: any = undefined;

    try {
      profilePhotoUrl = profilePhotoFilename
        ? s3Service.getUrlFromFilename(profilePhotoFilename)
        : '';

      // At 31/01/2022 referredBy field could be the affiliateId or the customerNumber(number) field of a referred user.
      // the below code will always get the affiliateId of the found user by 'referredBy' value, whether referredBy contains an affiliateId or a customerNumber(number).
      realReferredId = await userService.getAffiliateIdByAffiliateIdOrCustomerNumber(
        referredBy,
      );
    } catch (err) {
      logger.exceptionContext(
        err,
        'resolvers.auth.createUser.photoAndReferralId failed',
        {
          email,
          profilePhotoFilename,
          profilePhotoUrl: JSON.stringify(profilePhotoUrl),
          realReferredId: JSON.stringify(realReferredId),
        },
      );
    }

    const userObj: any = {
      email: firebaseUser.email.toLowerCase(),
      firebaseUid: firebaseUser.uid,
      firstName,
      lastName,
      displayName,
      profilePhotoUrl,
      phone,
      affiliateId,
      language,
      referredBy: realReferredId || configAws.defaultReferredBy,
      lastLogin: new Date(),
      number,
      utmInfo: {
        offer,
        referredBy,
        utmCampaign,
        utmMedium,
        utmSource,
        utmContent,
        utmKeyword,
        utmName,
        utmTerm,
      },
      termsAndConditionsAgreement: [
        {
          timestamp: new Date(),
          templateId: termsTemplateId,
          ipAddress: args.ipAddress || '',
        },
      ],
      privacyPolicyAgreement: [
        {
          timestamp: new Date(),
          templateId: privacyTemplateId,
          ipAddress: args.ipAddress || '',
        },
      ],
      activationTermsAndConditions,
      gender,
      dateOfBirth,
      country,
      countryCode,
      countryPhoneCode,
      clinic,
      careclixId,
      street,
      city,
      state,
      zipCode,
    };

    let newUser: IUser & { _id: any } = undefined;

    try {
      if (typeof communicationConsent === 'boolean') {
        userObj.communicationConsent = [
          {
            consentGiven: communicationConsent,
            timestamp: new Date(),
          },
        ];
      }

      newUser = new User(userObj);

      try {
        url = await linkShortener.getLink(newUser);
      } catch (error) {
        logger.exceptionContext(
          error,
          'resolvers.auth.createUser.linkShortener failed',
          {
            email,
            url,
            newUser: JSON.stringify(newUser),
          },
        );
        url = await bitly.getLink(newUser);
      }
    } catch (err) {
      logger.exceptionContext(
        err,
        'resolvers.auth.createUser.linkShortener_bitly failed',
        {
          email,
          url,
          newUser: JSON.stringify(newUser),
        },
      );
    }

    try {
      newUser.set('wallet.shareLink', url);
      newUser.set('wallet.userCreatedInWallet', true);

      /*if (configAws.brand === 'blue') {
        await careclix.signUp(newUser, password);
      }*/

      await newUser.save();

      //await emailService.sendWelcomeEmail({ email: newUser.email });
      if (configAws.brand === 'galvan') {
        sendinblueService.sendWelcomeEmail(newUser.email);
        sendinblueService.addContactList(newUser.email, 2);

        const wpData = await axios.post<any>(
          `${configAws.wpApiUrl}/bb_wallet/v1/get_wp_user_data?ApiKey=${configAws.wpApiKey}&userId=&email=${encodeURIComponent(newUser.email)}&productId=8883`,
          {}
        )

        // If someone checks  “Add me to Galvan Insider so I can receive email news and updates.”, automatically add them to the email list in Sendinblue called “Insiders” — ID #3.
        if(wpData.data.mepr_add_me_to_galvan_insider_so_i_can_receive_email_news_and_updates === 'on') {                
          sendinblueService.addContactList(wpData.data.user_email, 3);
        }
      }
    } catch (err) {
      logger.exceptionContext(
        err,
        'resolvers.auth.createUser.newUserSave failed',
        {
          email,
          newUser: JSON.stringify(newUser),
        },
      );
    }

    let customToken: string = '';
    try {
      const ignoreExpired = 'DEBUG' in process.env;
      customToken = token
        ? await auth.signIn(token, configAws.hostname)
        : await auth.signInAfterRegister(firebaseUser.uid, configAws.hostname);
      context.user = UserApi.fromCustomToken(customToken, ignoreExpired);

      const response: {
        twoFaEnabled: boolean;
        token: string;
        walletExists: boolean;
        verificationEmailSent?: boolean;
      } = {
        twoFaEnabled: false,
        token: customToken,
        walletExists: false,
        verificationEmailSent: false,
      };

      return response;
    } catch (err) {
      logger.exceptionContext(
        err,
        'resolvers.auth.createUser.customToken failed',
        {
          email,
          newUser: JSON.stringify(newUser),
          hostName: configAws.hostname,
          token,
          customToken,
        },
      );
    }
  };

  public updateUser = async (
    parent: any,
    args: {
      userInfo: {
        email?: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        profilePhotoFilename?: string;
        phone?: string;
        password?: string;
        communicationConsent?: boolean;
        secondaryEmail?: string;
        language?: string;
        updateUserIds?: IUpdateUserIds;
        activationTermsAndConditions?: {}[];
        gender?: string;
        dateOfBirth?: Date;
        country?: string;
        countryCode?: string;
        countryPhoneCode?: string;
        clinic?: string;
        careclixId?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        token?: string;
        updateUserNumber?: boolean;
      };
    },
    context: Context,
  ) => {
    const { user } = context;
    logger.debug(`resolvers.auth.updateUser.userId:${user && user.userId}`);
    this.requireAuth(user);
    const {
      email,
      firstName,
      lastName,
      displayName,
      profilePhotoFilename,
      phone,
      password,
      communicationConsent,
      secondaryEmail,
      language,
      country,
      updateUserNumber,
      updateUserIds,
      activationTermsAndConditions,
    } = args.userInfo;

    try {
      const userDoc = await user.findFromDb();
      const emailPass: { email?: string; password?: string } = {};

      const oldUserEmail = userDoc.email;
      const emailsAreEqual =
        oldUserEmail.toLowerCase().trim() === email?.toLowerCase().trim();

      if (!emailsAreEqual && email) {
        emailPass.email = email;
        userDoc.set('email', email);
        userDoc.set('emailVerified', undefined, { strict: false });
        await auth.updateUserAuth(
          user.uid,
          { emailVerified: false },
          configAws.hostname,
        );
      }
      if (secondaryEmail) {
        userDoc.set('secondaryEmail', secondaryEmail);
      }
      if (password) {
        emailPass.password = password;
      }
      if (emailPass.email) {
        const result = await axios.post<WooUpdateUser>(
          `${configAws.wpApiUrl}/bb_iam/v1/update_user_email?ApiKey=${configAws.wpApiKey}&user_email=${oldUserEmail}&new_user_email=${emailPass.email}`,
          {},
        );
        if (result.data.log_results !== 1) {
          logger.debug(
            `resolvers.auth.updateUser.userId:${user &&
              user.userId} do not loggin`,
          );
        }
        logger.debug(
          `resolvers.auth.updateUser.userId:${user &&
            user.userId} is trying to update WP email`,
        );
        if (result.data.success !== 1) {
          logger.debug(
            `resolvers.auth.updateUser.userId:${user &&
              user.userId} do not update WP email`,
          );
          throw new Error(result.data.message);
        }
        logger.debug(
          `resolvers.auth.updateUser.userId:${user &&
            user.userId} update WP email`,
        );
      }
      //update worpressEmail just be sure it is not in FirebaseBB and mongo.
      if (emailPass.email || emailPass.password) {
        await auth.updateUserAuth(user.uid, emailPass, configAws.hostname);
        const fbUser = await auth.updateUserAuth(
          user.uid,
          emailPass,
          configAws.hostname,
        );
        if (!fbUser) throw new Error('Email is in use or not allowed password');
      }
      if (firstName) {
        userDoc.set('firstName', firstName);
      }
      if (lastName) {
        userDoc.set('lastName', lastName);
      }
      if (displayName) {
        await auth.updateDisplayName(user.uid, configAws.hostname, displayName);
        userDoc.set('displayName', displayName);
      }
      if (profilePhotoFilename) {
        const profilePhotoUrl = s3Service.getUrlFromFilename(
          profilePhotoFilename,
        );
        userDoc.set('profilePhotoUrl', profilePhotoUrl);
      }
      if (phone) {
        userDoc.set('phone', phone);
      }
      if (country) {
        userDoc.set('country', country);
      }
      if (language) {
        userDoc.set('language', language);
      }
      if (typeof communicationConsent === 'boolean') {
        userDoc.set('communicationConsent', [
          {
            consentGiven: communicationConsent,
            timestamp: new Date(),
          },
        ]);
      }
      if (updateUserNumber && !userDoc.number) {
        const number = await getNextNumber();
        userDoc.set('number', number);
      }

      if (configAws.brand.toLowerCase() === 'connect' && updateUserIds) {
        const { userIds } = updateUserIds;
        if (!updateUserIds.unsetMissingUserIds) {
          //just overwrite the userdIds in userIds object.
          let UserIdKey: keyof typeof userIds;
          for (UserIdKey in userIds) {
            const userIdValue = userIds[UserIdKey];
            if (userIdValue) userDoc.set(`userIds.${[UserIdKey]}`, userIdValue);
            //if userIdValue is falsy unset the specific userId from the subdocument userIds
            else
              userDoc.set(`userIds.${[UserIdKey]}`, undefined, {
                strict: false,
              });
          }
        } else if (userIds && Object.keys(userIds).length === 0) {
          // Make userIds object equal  {} to unset de database sub-document.
          userDoc.set('userIds', undefined, { strict: false });
        } else {
          // Replace the entire userIds database sub-document.
          userDoc.set('userIds', userIds);
        }
      }

      if (activationTermsAndConditions?.length) {
        userDoc.set(
          'activationTermsAndConditions',
          activationTermsAndConditions,
        );
      }

      const savedUser = await userDoc.save();
      if (email && configAws.brand.toLowerCase() === 'gala') {
        /**
         * Wheter the next sentence fails or not, it is still needed to return a value,
         * because at this point the user had been updated.
         */
        try {
          await this.sendVerifyEmail('_', { newAccount: false }, context);
        } catch (error) {
          //Todo: consider to add a sendVerifyEmailError field to the graphql type: UpdateUserResponse!,
          //and set this field here.
        }
      }
      logger.debug(
        `resolvers.auth.updateUser.updatedProfile.id:${savedUser &&
          savedUser.id}`,
      );
      return {
        success: true,
        user: savedUser,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  };

  public getUserProfile = async (
    parent: { userApi: UserApi },
    args: {},
    { user, dataSources, wallet }: Context,
  ) => {
    logger.debug(`resolvers.auth.getUserProfile.userId:${user && user.userId}`);
    this.requireAuth(user);
    const { sendEmail } = dataSources;
    const profile: any = await user.findFromDb();
    profile.communicationConsent = sendEmail.checkUserConsent(profile);

    logger.debug(
      `resolvers.auth.getUserProfile.profile.id:${profile && profile.id}`,
    );

    const walletExists = await this.verifyWalletsExist(user, wallet);

    const result = {
      ...profile.toJSON(),
      twoFaEnabled: !!profile.twoFaSecret,
      walletExists,
      twoFaAuthenticated: false,
      twoFaSecret: '',
      twoFaQrCode: '',
    };

    return result;
  };

  private checkUniqueDisplayName = async (displayName: string) => {
    if (configAws.supportsDisplayNames && !displayName) {
      throw new Error('Display name not specified');
    } else if (!configAws.supportsDisplayNames) {
      return true;
    }
    const foundUser = await User.findOne({ displayName });

    return !foundUser;
  };

  public isDisplayNameUnique = (parent: any, args: { displayName: string }) => {
    const { displayName } = args;
    if (!configAws.supportsDisplayNames) {
      throw new Error('Display names not supported');
    }
    const unique = this.checkUniqueDisplayName(displayName);

    return {
      unique,
    };
  };

  public unsubscribe = async (
    parent: any,
    args: { userId: string; emailList: string },
  ) => {
    const { userId, emailList } = args;

    if (!userId || !emailList) {
      throw new Error('User ID and Email List required');
    }
    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          unsubscriptions: {
            list: emailList,
            timestamp: new Date(),
          },
        },
      });

      return { success: true };
    } catch(error) {
      logger.error("resolvers.user.unsubscribe");

      throw error;
    }
  };

  private getTemplateId = async (templateName: string) => {
    try {
      const { id } = await Template.findOne(
        { name: templateName },
        { id: '$id' },
      );
      return id;
    } catch(error) {
      logger.error("resolvers.user.getTemplateID");

      throw error;
    }
  };

  public acceptAgreements = async (
    parent: any,
    {
      agreementInfo,
    }: {
      agreementInfo: {
        privacyPolicy: boolean;
        termsAndConditions: boolean;
        ipAddress: string;
      };
    },
    { user }: Context,
  ) => {
    try {
      const { privacyPolicy, termsAndConditions, ipAddress } = agreementInfo;
      const userDoc = await user.findFromDb();

      if (termsAndConditions) {
        const termsTemplateId = await this.getTemplateId('terms-of-service');
        userDoc.termsAndConditionsAgreement.push({
          templateId: termsTemplateId,
          timestamp: new Date(),
          ipAddress,
        });
      }
      if (privacyPolicy) {
        const privacyPolicyTemplateId = await this.getTemplateId(
          'privacy-policy',
        );
        userDoc.privacyPolicyAgreement.push({
          templateId: privacyPolicyTemplateId,
          timestamp: new Date(),
          ipAddress,
        });
      }

      await userDoc.save();
      return { success: true };
    } catch(error) {
      logger.error("resolvers.user.acceptAgreements");

      throw error;
    }
  };

  public neededAgreements = async (
    parent: any,
    args: {},
    { user }: Context,
  ) => {
    try {
      const {
        termsAndConditionsAgreement,
        privacyPolicyAgreement,
      } = await user.findFromDb();
      const termsTemplateId = await this.getTemplateId('terms-of-service');
      const privacyTemplateId = await this.getTemplateId('privacy-policy');
      const neededAgreementNames = [];
      if (
        Array.isArray(termsAndConditionsAgreement) &&
        !termsAndConditionsAgreement.some(
          agreement => agreement.templateId === termsTemplateId,
        )
      ) {
        neededAgreementNames.push('Terms and Conditions');
      }
      if (
        Array.isArray(privacyPolicyAgreement) &&
        !privacyPolicyAgreement.some(
          agreement => agreement.templateId === privacyTemplateId,
        )
      ) {
        neededAgreementNames.push('Privacy Policy');
      }
      return { agreementNames: neededAgreementNames };
    } catch(error) {
      logger.error("resolvers.user.neededAgreements")

      throw error;
    }
  };

  public sendVerifyEmail = async (
    parent: any,
    { newAccount }: { newAccount: boolean },
    { user, dataSources }: Context,
  ) => {
    this.requireAuth(user);

    return {
      success: true,
    };
  };

  public verifyEmailAddress = async (
    parent: any,
    { token }: { token: string },
    { dataSources }: Context,
  ) => {
    try {
      const validToken = jwt.verify(token, configAws.jwtPublicKey, {
        algorithms: ['RS256'],
        issuer: `urn:${configAws.brand}`,
        audience: `urn:${configAws.brand}`,
        subject: `${configAws.brand}:subject`,
        ignoreExpiration: true,
      }) as { userId: string; uid: string };

      if (!validToken) {
        return {
          success: false,
          message: 'invalid token',
        };
      }

      const { userId, uid } = validToken;
      const userDoc = await User.findById(userId).exec();

      if (!userDoc.emailVerified) {
        userDoc.set('emailVerified', new Date());
        userDoc.save();

        auth.updateUserAuth(uid, { emailVerified: true }, configAws.hostname);
      }
      const hasLicense = !!(await License.findOne({ userId: userDoc.id }));

      const lists = [configAws.emailLists.general];

      if (userDoc?.wallet?.activations?.gala?.activated) {
        lists.push(configAws.emailLists.upgrade);
      }
      if (hasLicense) {
        lists.push(configAws.emailLists.nodeOwner);
      }

      return {
        success: true,
      };
    } catch(error) {
      logger.error("resolvers.user.verifyEmailAddress");

      throw error;
    }
  };

  private signVerifyEmailToken(userId: string, uid: string) {
    return jwt.sign({ userId, uid }, configAws.jwtPrivateKey, {
      algorithm: 'RS256',
      issuer: `urn:${configAws.brand}`,
      audience: `urn:${configAws.brand}`,
      subject: `${configAws.brand}:subject`,
    });
  }

  public getNameByCustomerNumber = async (
    parent: {},
    args: { affiliateIdOrCustomerNumber: string },
    { user, dataSources, wallet }: Context,
  ) => {
    const { affiliateIdOrCustomerNumber } = args;

    if (!affiliateIdOrCustomerNumber) return affiliateIdOrCustomerNumber;

    const result = await userService.getNameByCustomerNumber(
      affiliateIdOrCustomerNumber,
    );

    return result;
  };
}

export const userResolver = new Resolvers();

export default {
  Query: {
    userExists: userResolver.userExists,
    profile: userResolver.getUserProfile,
    isDisplayNameUnique: userResolver.isDisplayNameUnique,
    neededAgreements: userResolver.neededAgreements,
    getNameByCustomerNumber: userResolver.getNameByCustomerNumber,
  },
  Mutation: {
    createUser: userResolver.createUser,
    updateUser: userResolver.updateUser,
    unsubscribe: userResolver.unsubscribe,
    acceptAgreements: userResolver.acceptAgreements,
    sendVerifyEmail: userResolver.sendVerifyEmail,
    verifyEmailAddress: userResolver.verifyEmailAddress,
  },
};
