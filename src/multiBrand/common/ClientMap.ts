/**
 * The first implementation of this module is only for connect use.
 */
import { config, configAws } from 'src/common';
import { EBrands } from 'src/types';
function fillClientsMap(): Map<EBrands, string> {
  const brandClientsMap = new Map<EBrands, string>();
  configAws.WalletServersSiblingBrandsUrls.forEach((url: string, key: EBrands) => {
    brandClientsMap.set(key, `${url}/siblingBrands`);
  });
  return brandClientsMap;
}
class ClientMap {

  public getClientMap() {
    // If the brand !== connect then return null, the brandsClientMaps is only for connect use.
    let def: Map<EBrands, string>;
    if (config.brand.toUpperCase() === EBrands.CONNECT.valueOf()) {
      def = fillClientsMap();
    }
    else 
    {
      def = null;
    }
    return def;
  }
}
const clientMap = new ClientMap();
export default clientMap;
