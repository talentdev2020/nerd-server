import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { config, configAws, logger } from '../common';
import { IZendeskRequest, IZendeskTicket } from '../types';

class Zendesk extends RESTDataSource {
  baseURL = configAws.zendeskUrl;
  brandId = this.getBrandId(configAws.brand);

  willSendRequest(request: RequestOptions) {
    request.headers.set('Authorization', `Basic ${configAws.zendeskApiKey}`);
  }

  private getBrandId(brand: string) {
    switch (brand.toLowerCase()) {
      case 'gala': {
        return 360002080993;
      }
      case 'codex': {
        return 360001823754;
      }
      case 'connect': {
        return 360001823734;
      }
      case 'green': {
        return 360001823714;
      }
      case 'blue': case 'galvan': {
        return 360001738613;
      }
      default: {
        return 360001823734;
      }
    }
  }

  public async createTicket(ticket: IZendeskRequest) {
    logger.debug(
      `data-sources.zendesk.createTicket.ticket.userId: ${ticket.userId}`,
    );
    const { audit } = await this.post('/tickets.json', {
      ticket: {
        subject: ticket.subject,
        comment: { body: ticket.comment },
        requester: ticket.requester,
        external_id: ticket.userId,
        additional_tags: ['wallet'],
        brand_id: this.brandId,
      },
    });
    return audit.ticket_id;
  }

  public async getUserTickets(
    userId: string,
    page: number,
  ): Promise<IZendeskTicket[]> {
    logger.debug(`data-sources.zendesk.getUserTickets: ${userId}`);
    const { results } = (await this.get('/search.json', {
      query: `type:ticket external_id:${userId}`,
      page: page,
    }));
    return results.map((result: any) => {
      const {
        created_at: createdAt,
        updated_at: updatedAt,
        status,
        raw_subject: subject,
        id,
        description,
      } = result;
      return {
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
        status,
        subject,
        id,
        description,
      };
    });
  }
}

export default Zendesk;
