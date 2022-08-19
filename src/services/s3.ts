import * as aws from 'aws-sdk';
import { configAws } from '../common';
import { v4 as randomString } from 'uuid';

class S3Service {
  s3: aws.S3;
  
  constructor() {
    aws.config.update({
      region: configAws.s3Region,
      maxRetries: 2,
      httpOptions: {
        timeout: 2 * 1000,
        connectTimeout: 3 * 1000,
      },
    });
    this.s3 = new aws.S3();
  }

  private customBackoff = (retryCount: number) => {
    console.log(`retry count: ${retryCount}, waiting: 1000ms`)
    return 1000
  }

  public getUrlFromFilename = (filename: string) => {
    const url = `https://${configAws.s3Bucket}.s3.amazonaws.com/${filename}`;

    return url;
  };

  private getParams = (fileName: string, fileType: string) => {
    const baseParams = {
      Bucket: configAws.s3Bucket,
      Expires: 900,
      ACL: 'public-read',
    };
    return {
      ...baseParams,
      Key: fileName,
      ContentType: fileType,
    };
  };

  getSignedUrl = (fileName: string, fileType: string) => {
    const randomizedFileName = `${randomString()}-${fileName.replace(
      /\s/g,
      '-',
    )}`;
    const params = this.getParams(randomizedFileName, fileType);
    return new Promise((resolve, reject) => {
      this.s3.getSignedUrl('putObject', params, (err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          const returnData = {
            signedRequest: data,
            filename: randomizedFileName,
            url: this.getUrlFromFilename(randomizedFileName),
          };
          resolve(returnData);
        }
      });
    });
  };
}

export default new S3Service();
