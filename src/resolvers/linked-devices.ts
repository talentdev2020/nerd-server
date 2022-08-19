import ResolverBase from '../common/Resolver-Base';
import { logger } from '../common';
import { Context } from '../types';
import { linkedDevice, ILinkedDevice } from '../models';

class Resolvers extends ResolverBase {
  getLinkedDevices = async (parent: any, args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);
    const userId = user.userId;
    try {
      logger.debug(`resolvers.linked-device.getLinkedDevices`);
      const linkedDevices = await linkedDevice.find({
        UserId: userId,
      });
      return linkedDevices;
    } catch (err) {
      logger.warn(`resolvers.linked-device.getLinkedDevices.catch: ${err}`);
      return {
        success: false,
        message: err,
      };
    }
  };

  addLinkedDevice = async (
    parent: any,
    args: { device: Required<{ SerialNumber: string; DeviceType: string }> },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);
    const UserId = user.userId;
    const { SerialNumber, DeviceType } = args.device;
    const Created = new Date();

    const device: ILinkedDevice = { UserId, SerialNumber, DeviceType, Created };

    try {
      logger.debug(`resolvers.linked-device.getLinkedDevices`);
      const retDevice = await linkedDevice.create(device);
      if (retDevice)
        return {
          success: true,
          message: 'Device linked',
        };
      else
        return {
          success: false,
          message: 'Device not linked',
        };
    } catch (err) {
      logger.warn(`resolvers.linked-device.getLinkedDevices.catch: ${err}`);
      return {
        success: false,
        message: err,
      };
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    getLinkedDevices: resolvers.getLinkedDevices,
  },
  Mutation: {
    addLinkedDevice: resolvers.addLinkedDevice,
  },
};
