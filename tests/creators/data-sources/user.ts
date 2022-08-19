import { User } from 'src/models';
import { UserApi } from 'src/data-sources';

export default function create(userId: string): UserApi {
  const userApi: Partial<UserApi> = {
    userId: userId,
    findFromDb: async () => {
      const user = await User.findById(userId).exec();
      return user;
    },
  };

  return userApi as UserApi;
}
