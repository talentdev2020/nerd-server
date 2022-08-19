import { Context } from '../types/context';
import { logger } from '../common';
import ResolverBase from '../common/Resolver-Base';
const autoBind = require('auto-bind');

class Resolvers extends ResolverBase {
  constructor() {
    super();
    autoBind(this);
  }

  public async createTicket(
    parent: any,
    args: { ticket: { subject: string; comment: string } },
    { user, dataSources: { zendesk } }: Context,
  ) {
    logger.debug(`resolvers.support.createTicket.userId: ${user.userId}`);
    logger.debug(
      `resolvers.support.createTicket.userId: ${args.ticket.subject}`,
    );
    logger.debug(
      `resolvers.support.createTicket.userId: ${args.ticket.comment}`,
    );
    this.requireAuth(user);
    const { subject, comment } = args.ticket;
    const { firstName, lastName, email } = await user.findFromDb();
    const name = `${firstName || ''} ${lastName || ''}`;
    const ticket = {
      userId: user.userId,
      subject,
      comment,
      requester: {
        name,
        email,
      },
    };
    const ticketId = await zendesk.createTicket(ticket);
    logger.debug(`resolvers.support.createTicket.ticketId: ${ticketId}`);
    return {
      success: true,
      message: ticketId,
    };
  }

  public async getUserTickets(
    parent: any,
    args: { page: number },
    { dataSources: { zendesk }, user }: Context,
  ) {
    this.requireAuth(user);
    const tickets = await zendesk.getUserTickets(user.userId, args.page);
    return tickets;
  }
}

const resolvers = new Resolvers();

export default {
  Query: {
    userTickets: resolvers.getUserTickets,
  },
  Mutation: {
    createTicket: resolvers.createTicket,
  },
};
