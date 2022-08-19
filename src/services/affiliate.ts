import { config, configAws } from '../common';
import { IAffiliateLink, AffiliateLink, AffiliateLinkUser } from 'src/models';
import { UserApi } from '../data-sources/';
import { Bitly } from 'src/data-sources';
import { IAffiliateLinkUser } from 'src/models/affiliate-link-user';

class AffiliateService {
  private bitly = new Bitly();

  affiliateLink = async (affiliateId: string) => {
    const affiliateLink = await AffiliateLink.findById(affiliateId).exec();
    return affiliateLink;
  };

  getAffiliateLinks = async (): Promise<IAffiliateLink[]> => {
    const affiliateLinks: IAffiliateLink[] = await AffiliateLink.find().exec();

    return affiliateLinks;
  };

  userAffiliateLinks = async (user: UserApi): Promise<IAffiliateLinkUser[]> => {
    const affiliateLinksUser: IAffiliateLinkUser[] = await AffiliateLinkUser.find({
      userId: user.userId,
    }).exec();

    return affiliateLinksUser;
  };

  addAffiliateLinkToUser = async (
    user: UserApi,
    affiliateLink: IAffiliateLink,
  ) => {
    const userDoc = await user.findFromDb();
    const longUrl = `${affiliateLink.pageUrl}?r=${userDoc.affiliateId}&utm_source=${config.brand}&utm_medium=${user.userId}&utm_campaign=&utm_term=`;

    const bitlyLink = await this.bitly.shortenLongUrl(
      longUrl,
      configAws.bitlyGuid,
    );

    const affiliateLinkUser = new AffiliateLinkUser({
      userId: user.userId,
      affiliateLinkId: affiliateLink.id,
      bitlyLink: bitlyLink,
      longLink: longUrl,
      created: new Date(),
    });

    await affiliateLinkUser.save();

    return affiliateLinkUser;
  };
}

export const affiliate = new AffiliateService();
