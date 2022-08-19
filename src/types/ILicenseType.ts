import { ICustomGraphQLError } from './ICustomGraphQLError';

export default interface ILicenseType {
  _id: string;
  name: string;
  rewardType: string;
  environmentType: string;
  topPerformingMinerRewardPerDollarMined: number;
  remainingMinerRewardPerDollarMined: number;
  concurrentDevices: number;
  promoPointsPerDay: number;
  nodeType?: string;
  fullNode?: boolean;
  destinationLicenseTypeId: string;
}
export interface ILicenseCount {
  name: string;
  rewardType: string;
  nodeType: string;
  count: number;
  inUseCount: number;
}

export interface ILicenseCountAndNodesOnlineResponse {
  nodesOnline: number | { success: boolean; message: any; };
  licenseCount: ILicenseCount[];
}

export type ILicenseTypeCountAndNodesOnlineOrError =
  | ILicenseCountAndNodesOnlineResponse
  | ICustomGraphQLError;