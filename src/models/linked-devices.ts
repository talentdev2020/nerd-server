import { Document, model, Schema } from 'mongoose';

export interface ILinkedDevice {
  UserId: string;
  SerialNumber: string;
  DeviceType: string;
  Created: Date;
  Removed?: Date;
}

export const linkedDeviceSchema = new Schema({
  UserId: String,
  SerialNumber: String,
  DeviceType: String,
  Created: Date,
  Removed: { type: String, required: false },
});

export interface ILinkedDeviceDocument extends ILinkedDevice, Document {}

const linkedDevice = model<ILinkedDeviceDocument>(
  'linked-device',
  linkedDeviceSchema,
);

export default linkedDevice;
