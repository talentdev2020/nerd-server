// import { GameProduct } from '../models';
// import { IGameProduct, gameProductCoins, gameOptions } from '../types';
// import { Types, connect } from 'mongoose';

// void (async () => {
//   await connect('');
//   await GameProduct.deleteMany({});

//   const rarity = {
//     legendary: {
//       icon:
//         'https://gala-tokens.s3.amazonaws.com/images/sandbox-games/town-star/rarity/legendary.png',
//       label: 'Legendary',
//       hexcode: '#FABB00',
//     },
//   };
//   const newProducts: (IGameProduct & { _id: Types.ObjectId })[] = [
//     {
//       _id: Types.ObjectId('5e6ac731a8dad001ef268b81'),
//       name: 'Loot Box',
//       description: '',
//       game: gameOptions.townStar,
//       image:
//         'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/products/loot-box.png',
//       quantities: [1, 10, 25, 100],
//       priceUsd: 10,
//       basePriceUsd: 10,
//       coin: gameProductCoins.BTC,
//     },
//     {
//       _id: Types.ObjectId('5e6ac731a8dad001ef268b82'),
//       name: 'FarmBot',
//       description:
//         'FarmBot mines BoxCoin in the world of Town Star!  Look for locations to mine on  your world map during a play session!',
//       game: gameOptions.townStar,
//       image:
//         'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/products/farm-bot.png',
//       quantities: [1],
//       priceUsd: 100_000,
//       basePriceUsd: 100_000,
//       coin: gameProductCoins.BTC,
//       baseId:
//         '0x8000000000000000000000000000000100000000000000000000000000000000',
//       rarity: {
//         ...rarity.legendary,
//         supplyLimit: 1000,
//       },
//     },
//   ];

//   await GameProduct.insertMany(newProducts);
// })();
