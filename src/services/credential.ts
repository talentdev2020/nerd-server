import { config, logger } from '../common';

import { AxiosError } from 'axios';
import { ServerToServerService } from './server-to-server';
import { isStringArray } from 'src/types/common';

class CredentialService extends ServerToServerService {
  private apiKeyUrl = `${config.apiKeyServiceUrl}/api/v1/api-keys`;
  private healthUrl = `${config.apiKeyServiceUrl}/health`;

  public create = async (
    userId: string,
    coin: string,
    resource: string,
    payload: string,
  ) => {
    try {
      const resourceKey = `${coin}-${resource}`;
      const apiKeyUrl = `${this.apiKeyUrl}/`;
      const jwtAxios = this.getAxios({
        userId,
        accountId: resourceKey,
      });

      const createResponse = await jwtAxios.post(apiKeyUrl, {
        userId: userId,
        accountId: resourceKey,
        apiKey: payload,
      });

      return createResponse;
    } catch (error) {
      logger.exceptionContext(error, 'services.credential.create.catch', {
        userId,
        coin,
        resource,
        payload,
      });

      throw error;
    }
  };

  public get = async (
    userId: string,
    coin: string,
    resource: string,
    supressErrorLog = false,
  ) => {
    try {
      const resourceKey = `${coin}-${resource}`;
      const apiKeyUrl = `${this.apiKeyUrl}/${userId}/${resourceKey}`;
      const jwtAxios = this.getAxios({
        userId,
        accountId: resourceKey,
      });
      const response = await jwtAxios.get(apiKeyUrl, {
        params: {
          userId: userId,
        },
      });
      return response.data;
    } catch (error) {
      if (!supressErrorLog) {
        logger.exceptionContext(error, `services.credential.get.catch`, {
          userId,
          coin,
          resource,
        });
      }
      throw error;
    }
  };  

  public getAllKeysAllUsers = async(
    userIds:string[],
    supressErrorLog = false,
  ):Promise<{userId:string,accountsIds:string[]}[]>=>{
    const jwtAxios = this.getAxios({
      role:"admin",
    });
    try {
      const apiKeyUrl = `${this.apiKeyUrl}/get/all-key-names-of-users`;
      const response = await jwtAxios.post(apiKeyUrl,{userIds});
      return response.data;
    } catch (error) {
      if (!supressErrorLog) {
       logger.exception(error);
      }
      throw error;
    }
  }


  


  public getAllKeyNamesByUserId = async (
    userId: string,    
    supressErrorLog = false,
  ):Promise<string[]> => {
    try {      
      const apiKeyUrl = `${this.apiKeyUrl}/all-key-names/${userId}`;
      const jwtAxios = this.getAxios({
        userId,
      });
      const response = await jwtAxios.get(apiKeyUrl,{
        params: {
          userId: userId,
        },
      });
      return response.data;
    } catch (error) {
      if (!supressErrorLog) {
        logger.exceptionContext(error, `services.credential.get.catch`, {
          userId,     
        });
      }
      throw error;
    }
  };

  public archiveAllKeysByUserId = async (
    userId: string,        
  ):Promise<string[]> => {    
    let data:string[];
    try {      
      const apiKeyUrl = `${this.apiKeyUrl}/archive`;
      const jwtAxios = this.getAxios({
        userId,        
      });      
      const response = await jwtAxios.post<string[]>(apiKeyUrl, {userId});
      data = response.data;
    } catch (error) {      
      logger.exceptionContext(error, `services.credential.archiveAllKeysByUserId.catch`, {userId });
      throw new Error("Server error");
    } 
    if (!isStringArray(data)){
      logger.exception("unexpected response from credential service");
      throw new Error("unexpected response");
    }
    return data;
  };

  public handleErrResponse = (error: AxiosError, messageIf404: string) => {
    logger.exceptionContext(error, `services.credential.handleErrorResponse`, {
      messageIf404,
    });
    if (error.response && error.response.status === 404) {
      throw new Error(messageIf404);
    }
    throw error;
  };

  public checkHealth = async (userId: string) => {
    try {
      const jwtAxios = this.getAxios({
        userId,
      });
      const { data } = await jwtAxios.get(`${this.healthUrl}/`);
      return data.redis.ok === true;
    } catch (error) {
      logger.exceptionContext(error, `services.credential.checkHealth.catch`, {
        userId,
      });
      return false;
    }
  };

  public checkHealthStatus = async (userId: string) => {
    try {
      const jwtAxios = this.getAxios({
        userId,
      });

      const { data } = await jwtAxios.get(`${this.healthUrl}/`);
      return data;
    } catch (error) {
      logger.exceptionContext(
        error,
        `services.credential.checkHealthStatus.catch`,
        {
          userId,
        },
      );
    }
  };
}

export default new CredentialService();
