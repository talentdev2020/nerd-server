import { configAws } from '../common';
import { ServerToServerService } from './server-to-server';
import {
  ITokenClaim,
  IUnclaimedToken,
  IClaimQuote,
} from '../types/token-claim';

class TokenClaim extends ServerToServerService {
  

  public getClaimableTokens = async (userId: string) => {
    const baseUrl = `${configAws.tokenClaimsApiUrl}`;
    const axios = this.getAxios({ userId });

    const { data } = await axios.get<IUnclaimedToken[]>(
      `${baseUrl}/token/claimable/${userId}`,
    );

    return data;
  };

  public getClaimQuote = async (userId: string) => {
    const baseUrl = `${configAws.tokenClaimsApiUrl}`;
    const axios = this.getAxios({ userId });

    const { data } = await axios.post<IClaimQuote>(
      `${baseUrl}/claim-fee`,
      { userId },
    );

    return data;
  };

  public getUnseenFulfilledClaims = async (userId: string) => {
    const baseUrl = `${configAws.tokenClaimsApiUrl}`;
    const axios = this.getAxios({ userId });

    const { data } = await axios.get<ITokenClaim[]>(
      `${baseUrl}/claim/unseen/${userId}`,
    );

    return data;
  };

  public markClaimsAsSeen = async (userId: string) => {
    const baseUrl = `${configAws.tokenClaimsApiUrl}`;
    const axios = this.getAxios({ userId });

    const { data } = await axios.put<{ success: boolean }>(
      `${baseUrl}/claim/seen/${userId}`,
    );

    return data;
  };

  public claimTokens = async ({ userId, ...rest }: ITokenClaim) => {
    const baseUrl = `${configAws.tokenClaimsApiUrl}`;
    const axios = this.getAxios({ userId });

    const { data } = await axios.post<ITokenClaim>(`${baseUrl}/claim`, {
      userId,
      ...rest,
    });

    return data;
  };
}

export const tokenClaimService = new TokenClaim();
