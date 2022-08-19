import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

export default {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      if (value.getTime) {
        return value.getTime(); // value sent to the client
      } else {
        return new Date(value).getTime();
      }
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        const dateInt = Number(ast.value);
        if (Number.isNaN(dateInt)) return new Date(dateInt);
        return new Date(Number(ast.value)); // ast value is always in string format
      }
      return null;
    },
  }),
};
