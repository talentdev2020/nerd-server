import * as mongoose from 'mongoose';

export interface ISendinblueKeyModel extends mongoose.Document {
    sendinblueApiKey: string;
}
export const sendinblueKeySchema = new mongoose.Schema({    
    sendinblueApiKey: String,
})

const SendinblueKey = mongoose.model<ISendinblueKeyModel>(
    'sendinblue-keys',
    sendinblueKeySchema,
);
  
export default SendinblueKey;