import tokenMap from 'src/multiBrand/common/serverTokenManager';
import brandClientMap from 'src/multiBrand/common/ClientMap';
import { ICustomGraphQLError, EBrands, isICustomGraphQLError } from 'src/types';
import { logger } from 'src/common';
import axios from 'axios';
import { ETokenTypes } from '../types';

const TIMEOUT = 10000;

export class MultiBrandClient {


    /** 
     *@template EPRT  The expected end point return type from the target brand.
    * @template EARGST The expected end point args type the the target brand will receive. 
    * @template ECONTEXT The expected end point context Type the target brand will receive. This intends to be like a graphQL context type.
    * @param endPoint The enpoint name of the target brand.
    * @param tokenType The type of token, to be used.
    * @param propNameIfArray If the target brand returns an array, this will be used to wrapp the array into an object.
    * @param requestTimeOut The maximun time in ms, allowed for the target brand to response, default to 10,000.
    * @returns function 
    */

    private GetOtherBrandClient = <EPRT, EARGST, ECONTEXT>(
        endPoint: string,
        tokenType: ETokenTypes,
        propNameIfArray?: string,
        requestTimeOut: number = TIMEOUT,
    ) => {
        const tokenManager = tokenMap.get(tokenType);
        if (!tokenManager)
            throw new Error(`Token manager not found for ${tokenType.valueOf()}`);

        /**
        * 
        * @param brand the target brand
        * @param args the arguments to pass to the target brand
        * @param ctx the context to pass to target brand it intends to be like a graphQL context type.
        * @returns Promise<unknown[]>
        */
        const toReturn = async (
            brand: EBrands,
            args: ETokenTypes,
            ctx?: ECONTEXT,
        ) => {
            let res: EPRT | ICustomGraphQLError | { [name: string]: EPRT };
            const client = brandClientMap.getClientMap().get(brand);
            if (client) {
                let token;
                try {
                    token = await tokenManager.getToken();
                } catch (error) {
                    logger.exception(
                        `multibrand.common.multiBrandClient.getOtherBrandData could not get token`,
                    );
                    return {
                        brand: brand,
                        res: <ICustomGraphQLError>{ message: 'Server error', code: '' },
                    };
                }

                const headers = {
                    Authorization: `Bearer ${token}`,
                };
                const params = {
                    args,
                    ctx,
                };

                try {
                    const axiosResponse = await axios.post(`${client}${endPoint}`, params, {
                        headers,
                        timeout: requestTimeOut,
                    });
                    res = axiosResponse.data as EPRT;
                    if (Array.isArray(res) && propNameIfArray) res = { [propNameIfArray]: res };
                } catch (error) {
                    if (isICustomGraphQLError(error?.response?.data)) {
                        res = <ICustomGraphQLError>error.response.data;
                    } else {
                        res = <ICustomGraphQLError>{ message: error?.message || `something went wrong with the request to brand ${brand.toUpperCase()}`, code: '' };
                    }
                    logger.exception(
                        `multibrand.common.multiBrandClient.getOtherBrandData.axios.post error from brand ${brand}: ${JSON.stringify(res)}`,
                    );
                }
            } else {
                res = <ICustomGraphQLError>{
                    message: `connection from 'CONNECT' to '${brand}' is not implemented`,
                    code: '',
                };
            }
            return { brand: brand, res };
        };
        return toReturn;
    }

    /**
    * 
    * @template EPRT  The expected end point return type from others brand.
    * @template EARGST The expected end point arguments type the other brands will receive. 
    * @template ECONTEXT The expected end point context type the other brands will receive. This try to mimmic the grapqhql contextType.
    * @param wrapperPropertyNameToReturn getOtherBrandData will return an  EPRT | ICustomGraphQLError, this will be wrapp in an object with the property wrapperPropertyNameToReturn
    * @param OtherBrandsEndpoint The enpoint name of the other brands.
    * @param tokenType The type of token, to be used.
    * @param propNameIfArray If the other brands returns an array, this will be used to wrapp the array into an object.  
    * @returns function
    */

    public getMultiBrandClient = <EPRT, EARGST, ECONTEXT>(wrapperPropertyNameToReturn: string,
        OtherBrandsEndpoint: string,
        tokenType: ETokenTypes,
        propNameIfArray?: string) => {
        const otherBrandClient = this.GetOtherBrandClient<EPRT, EARGST, ECONTEXT>(OtherBrandsEndpoint, tokenType, propNameIfArray);
        /**
        * 
        * @param requiredBrandsArgs It's a list of brands with them args, and ctx;
        * @returns Promise<unknown[]>
        */
        const toReturn = async (requiredBrandsArgs: { brand: EBrands; args?: EARGST; ctx?: ECONTEXT }[]) => {
            const promiseArray = [];
            for (const item of requiredBrandsArgs) {
                let args: ETokenTypes = ETokenTypes.MULTIBRAND_USER;
                if(item.args){
                    args = ETokenTypes[item.args.toString() as keyof typeof ETokenTypes];
                }
                promiseArray.push(otherBrandClient(item.brand, args, item.ctx));
            }
            const res = await Promise.all(promiseArray);
            return res.map(item => {
                return { brand: item.brand, [wrapperPropertyNameToReturn]: item.res };
                // return {brand: '', [wrapperPropertyNameToReturn]: undefined}
            });
        };
        return toReturn;
    }

}

// const multiBrandClient = new MultiBrandClient();
// export default multiBrandClient;
