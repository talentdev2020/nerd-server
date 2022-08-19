import {
    ILicenseTypeCountAndNodesOnlineOrError,
} from 'src/types';

class Resolvers {
    ILicenseTypeCountAndNodesOnlineOrError(
        obj: ILicenseTypeCountAndNodesOnlineOrError,
    ) {
        if (obj.hasOwnProperty('licenseCount') && obj.hasOwnProperty('nodesOnline'))
            return 'LicenseTypeCountAndNodesOnlineResponse';
        if (obj.hasOwnProperty('message')) return 'ErrorResponse';
        return null;
    }

}
const resolvers = new Resolvers();
export default {
    LicenseCountAndNodesOnlineResponseOrError: {
        __resolveType: resolvers.ILicenseTypeCountAndNodesOnlineOrError,
    },
};