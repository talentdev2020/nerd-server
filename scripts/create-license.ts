import { connection, connect } from "mongoose";
import * as fs from 'fs';
import { License, User, LicenseTypeModel } from "../src/models";

const licenseLimit = 10;
const getConnectURLs = () => {
    return JSON.parse(fs.readFileSync('brand-info.json').toString());
}

const connectToDB = async(connectionString: string)=>{
    await connect(connectionString);
};

const closeConnectionToDB = async()=>{    
        await connection.close();      
}

const createLicense = async() => {
    if (process.argv.length !== 5) {
        console.log("Please ensure you input UserId and LicenseTypeID");
        process.exit(0);
    }
    const [,,brand, userId, licenseTypeId] = process.argv;
    try {
        const connectUrls: {[key:string]: string} = getConnectURLs();
        let connectString = connectUrls[brand.toLowerCase()];

        if (!connectString) {
            console.log("Please input correct brand");
            process.exit(0);
        }

        await connectToDB(connectString);
        console.log("connected to database");
        let license;

        try {
            const user = await User.findOne({ id: userId }).exec();
            if (!user) {
                console.log(`User Id(${userId}) doesn't exist`);
                process.exit(0);
            }
            const licenses = await License.find({userId}).exec();

            if (licenses.length >= licenseLimit) {
                console.log(`You reached the limit(${licenseLimit})`)
                process.exit(0);
            }
            const licenseType = await LicenseTypeModel.findOne({ id: licenseTypeId }).exec();
            if(!licenseType) {
                console.log(`There is no matched license type: ${licenseTypeId}`)
                process.exit(0);
            }

            license = await License.create({
                licenseTypeId,
                userId,
                created: new Date(),
                inUse: false,
                ownershipHistory: [{
                    receivedReason: `Testing for Stage`,
                    received: new Date(),
                }],
            })
            console.log("License Created: ", license);
        } catch (err) {
            console.log(
                `Failed to create license: ${err}`,
            );
            throw err;
        }
    } catch (error) {
        console.log('Failed to connect DB', error.message);
    }
    closeConnectionToDB().then(()=>{console.log("connection closed")});
}

createLicense();

