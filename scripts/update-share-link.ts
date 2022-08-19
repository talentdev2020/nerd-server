import * as mongoose from 'mongoose';
import axios from 'axios';
import { userSchema, IUser } from '../src/models/user';

(async () => {
  await mongoose.connect('');
  const User = mongoose.model<IUser>('users', userSchema);

  const users = await User.find({ wallet: { $exists: true } });

  const groupIdResponse = await axios.get(
    'https://api-ssl.bitly.com/v4/groups',
    {
      headers: {
        Authorization: 'Bearer 3deafb7b7485c99ad5ecc42ced69fb70dd239419',
        'Content-Type': 'application/json',
      },
    },
  );

  const groupId = groupIdResponse.data.groups[0].guid;

  let count = 0;
  for (const user of users) {
    const promise = new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 4000);
    });
    await promise;

    const affiliateId = encodeURIComponent(user.affiliateId);

    const longUrl = `https://www.blockoffers.io/connect-green-app-free-green-with-activation?r=${affiliateId}&utm_source=greenappshare&utm_medium=${user.id}&utm_campaign=5da6342bb60fc20f6a6c199a&utm_term=green_app_share`;

    // const shortenRes = await axios.post(
    //   'https://api-ssl.bitly.com/v4/shorten',
    //   {
    //     group_guid: groupId,
    //     long_url: longUrl,
    //   },
    //   {
    //     headers: {
    //       Authorization: 'Bearer 3deafb7b7485c99ad5ecc42ced69fb70dd239419',
    //       'Content-Type': 'application/json',
    //     },
    //   },
    // );

    // user.set('wallet.shareLink', shortenRes.data.link);
    user.set('wallet.shareLink', longUrl);
    await user.save();
    count++;
    console.log(count, users.length);
  }

  console.log('done');
})();
