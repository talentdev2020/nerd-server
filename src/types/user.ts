export { IUser } from '../models/user';

export interface RegisterInput {
  email: string;
  firebaseUid: string;
  role?: string;
  permissions?: string[];
  created?: Date;
}

export class WooUpdateUser {
  "success": number;
  "message": string;
  "log_results": number;
  "update_results": number
}
