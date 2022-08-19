import { dynamicSchemasArray } from './dynamicSchemas.index';
import { fileLoader, mergeTypes } from 'merge-graphql-schemas';
import * as path from 'path';
const typesArray: string[] = fileLoader(path.join(__dirname, './'));
//typesArray.push(...dynamicSchemasArray);

// if (config.brand === 'connect') {
//   const typesArrayConnect: string[] = fileLoader(
//     path.join(__dirname, 'multiBrand'),
//   );
//   typesArray.push(...typesArrayConnect);
// }

export default mergeTypes(typesArray, { all: true });
