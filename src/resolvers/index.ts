import { config } from '../common';
import { fileLoader, mergeResolvers } from 'merge-graphql-schemas';
import { IResolvers } from 'graphql-tools';
import * as path from 'path';

const resolversArray: IResolvers[] = fileLoader(path.join(__dirname, './'));

// console.log(
//   'calculated path in src\resolversindex.ts',
//   path.join(__dirname, 'multiBrand'),
// );

// if (config.brand === 'connect') {
//   const resolversArrayConnect: IResolvers[] = fileLoader(
//     path.join(__dirname, 'multiBrand'),
//   );
//   resolversArray.push(...resolversArrayConnect);
// }

export default mergeResolvers(resolversArray);
