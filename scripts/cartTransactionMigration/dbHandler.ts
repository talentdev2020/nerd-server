import { connection, connect } from 'mongoose';

export const connectToDB = async(connectionString:string)=>{
    await connect(connectionString);
};

export const closeConnectionToDB = async()=>{    
        await connection.close();      
}
