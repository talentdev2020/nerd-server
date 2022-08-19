import {connectToDB,closeConnectionToDB} from './dbHandler';
import {CartTransactionModel} from './cartTransactions.model'
import { logger} from './logger';

const MAX_ERRORS_IN_BATCHES = 3;
const MAX_ERRORS_IN_MIGRATE_BATCH_EXECUTIONS = 20;
const MAX_ERRORS_IN_MIGRATE_INSIDE_SINGLE_BATCH = 5;
const connectionString='mongodb://connectLocal:connectLocal@localhost:27017/connect-LOCAL?authSource=connect-LOCAL&readPreference=primary&appname=mongodb-vscode%200.6.14&directConnection=true&ssl=false';

//The total records processed will be maxIterations * BATCH_SIZE;
//If you wish to have a more controlled migration, set these vars to low values.
//Set MAX_ITERATIONS to avoid any risk of infinite loop.  
const MAX_BATCHES = 6; 
// Set BATCH_SIZE considering the memory needed to store a set of records
const BATCH_SIZE = 5;  

const filterCondition = {
    "migrationDataIncomplete":null,
    "$or": [
        // field:null => field does not exists or field === null;
        { "productId": null }, 
        { "productName": null },
        { "quantity": null },        
        { "memberId": null },        
    ]
};

const projectionObject = {
    data:1,
    productId:1,
    productName:1,
    quantity:1,
    memberId:1,    
};



let globalMigrationAttempt=0;
const migrateBatch = async(transactions:any[])=>{
    let toReturn = {
      totalMigrationsFailedCount:0,    
      totalMigrationsAttempsCount:0,
      totalMigrationsSuccedCount:0,    
      DocumentsWithMigrationDataIncompleteCount:0,
    }        

    for (const transaction of transactions) {
        const {_id} = transaction;
        const toSet:any={};
        try {            
            globalMigrationAttempt++;
            const parsed = JSON.parse(transaction.data);            
            let migrationDataIncomplete = false;

            if (!transaction.productId){
                if(parsed.membership?.id)                 
                    toSet.productId =  parsed.membership.id;
                else 
                    migrationDataIncomplete = true;
            }

           if (!transaction.productName){
                if(parsed.membership?.title)
                    toSet.productName = parsed.membership.title; 
                else 
                    migrationDataIncomplete = true;
           }

            /// section adds quantity field to document, with default value of 1. 
            /// all products are currently purchased one by one, this catches items
            /// with no quantity field or with quantity=null
            if (!transaction.quantity)                 
                toSet.quantity = 1;          

            /// section adds memberId field from data object
            if (!transaction.memberId) {
                if(parsed.member?.id)
                    toSet.memberId = parsed.member.id;
                else 
                    migrationDataIncomplete = true;
            }

            if (migrationDataIncomplete){
                toSet.migrationDataIncomplete = migrationDataIncomplete;
                toReturn.DocumentsWithMigrationDataIncompleteCount++;
            }

            /// pushes changed items to the database
            const updatedItem = await CartTransactionModel.updateOne({ _id }, { $set: toSet }).exec();
            if (updatedItem.modifiedCount >=1){
                const objectToLog = {
                    globalMigrationAttempt,
                    message:"fields migrated successfully",
                    transactionId:_id.toString(),
                    fieldsSet:JSON.stringify(toSet),
                    status:"success",
                }              
                logger.log(objectToLog);
                toReturn.totalMigrationsSuccedCount++;
            }else{
                const objectToLog = {
                    globalMigrationAttempt,
                    message:"no document modified!",
                    transactionId:_id.toString(),
                    fieldsSet:JSON.stringify(toSet),
                    status:"warnning",
                }              
                logger.log(objectToLog);
                toReturn.totalMigrationsFailedCount++;
            }
        }
        catch (error) {
            toReturn.totalMigrationsFailedCount++;
            const objectToLog = {  
                transactionId:_id.toString(),
                message:`failure inside migrateBatch`,
                status:"fail",
                error,
            }              
            logger.log(objectToLog);
            toReturn.totalMigrationsFailedCount++;
            if (toReturn.totalMigrationsFailedCount >= MAX_ERRORS_IN_MIGRATE_INSIDE_SINGLE_BATCH){
                const objectToLog = {                  
                  message:`migrationBatch iteration terminated. MAX_ERRORS_IN_MIGRATE_INSIDE_SINGLE_BATCH:"${MAX_ERRORS_IN_MIGRATE_INSIDE_SINGLE_BATCH}" reached`,
                  status:"fail",                           
                }
                logger.log(objectToLog);
                break;         
            }
        }    
    }
    return toReturn;
}

const migrate = async()=>{    
    try {
       await connectToDB(connectionString);
    } catch (error) {
        const objectToLog = {message:`Unable to connect to database. error: ${error}`};
        logger.log(objectToLog);
       return;
    }
        
    const migrationReport = {
        RemainingTransactionsToUpdateBeforeScriptExecution:0,
        RemainingTransactionsToUpdateAfterScriptExecution:0,
        DocumentsWithMigrationDataIncompleteCount:0,
        totalMigrationsAttempsCount:0,
        totalMigrationsFailedCount:0,
        totalMigrationsSuccedCount:0,        
        totalBatchesCount:0,
        finalStatus:"succcess",
    };    
    logger.log(`========"MIGRATION SCRIPT STARTED"==================`);

    let RemainingTransactionsToUpdate:number;
    let errorsInIterationsCount = 0;
    let batchCount = 1
    for (; batchCount <= MAX_BATCHES; batchCount++) {        
        try {
            RemainingTransactionsToUpdate = await CartTransactionModel.find(filterCondition).count().lean().exec();                               
            const objectToLog = {
                batchCount,
                RemainingTransactionsToUpdate
            }
            logger.log(objectToLog);

            if (batchCount === 1)
               migrationReport.RemainingTransactionsToUpdateBeforeScriptExecution = RemainingTransactionsToUpdate;

            if (RemainingTransactionsToUpdate<=0 || !RemainingTransactionsToUpdate){
                const objectToLog = {
                    batchCount,
                    status:"allMigrated",
                    message:"No more transactions to update"
                }
                logger.log(objectToLog);                
                migrationReport.finalStatus ="allMigrated";
                break;
            }                
        } catch (error) {
            const objectToLog = {
                batchCount,
                message:`the next statement failed: CartTransaction.find(filterCondition).count().lean().exec();`,
                status:"fail",
                error,
            }              
            logger.log(objectToLog);      
            errorsInIterationsCount++;
              if (errorsInIterationsCount >= MAX_ERRORS_IN_BATCHES){
                const objectToLog = {
                    iteration: batchCount,
                    message:`process terminated MAX_ERRORS:"${MAX_ERRORS_IN_BATCHES}" reached`,
                    status:"fail",                           
              }
              logger.log(objectToLog);
              migrationReport.finalStatus ="MAX_ERRORS_IN_BATCHES Reached";
              break; 
            };            
        }

        let transactions:any[];
        try {
          transactions = await CartTransactionModel.find(filterCondition, projectionObject).limit(BATCH_SIZE).lean().exec();    
        } catch (error) {
            const objectToLog = {
                message:`the next statement failed: CartTransaction.find(filterCondition, projectObject).limit(chunkSize).lean().exec();`,
                status:"fail",
                error:error,
            }
            logger.log(objectToLog);

            errorsInIterationsCount++;
            if (errorsInIterationsCount >= MAX_ERRORS_IN_BATCHES){
              const objectToLog = {
                  batchCount,
                  message:`process terminated MAX_ERRORS_IN_ITERATIONS:"${MAX_ERRORS_IN_BATCHES}" reached`,
                  status:"fail",                           
                }
                logger.log(objectToLog);
                migrationReport.finalStatus ="MAX_ERRORS_IN_BATCHES Reached";
                break;
            }
            continue;
        }    

        logger.log(`========Starting migrateBatch, iteration:"${batchCount}"==================`);
        const errorsInMigrateBatch = await migrateBatch(transactions);
        migrationReport.totalMigrationsFailedCount +=  errorsInMigrateBatch.totalMigrationsFailedCount; 
        migrationReport.totalMigrationsAttempsCount +=  errorsInMigrateBatch.totalMigrationsAttempsCount; 
        migrationReport.totalMigrationsSuccedCount +=  errorsInMigrateBatch.totalMigrationsSuccedCount; 
        migrationReport.DocumentsWithMigrationDataIncompleteCount +=  errorsInMigrateBatch.DocumentsWithMigrationDataIncompleteCount; 

        if (migrationReport.totalMigrationsFailedCount >= MAX_ERRORS_IN_MIGRATE_BATCH_EXECUTIONS){
            const objectToLog = {
                iteration: batchCount,
                message:`process terminated MAX_ERRORS_IN_MIGRATE_BATCH_EXECUTIONS:"${MAX_ERRORS_IN_MIGRATE_BATCH_EXECUTIONS}" reached`,
                status:"fail",                           
              }
              logger.log(objectToLog);
              migrationReport.finalStatus ="MAX_ERRORS_IN_MIGRATE_BATCH_EXECUTIONS Reached";
              break;
          }
        logger.log(`========migrateBatch finished, iteration:"${batchCount}"==================`);  
    }

    try {
        migrationReport.RemainingTransactionsToUpdateAfterScriptExecution = await CartTransactionModel.find(filterCondition).count().lean().exec();
    }
    catch{
        migrationReport.RemainingTransactionsToUpdateAfterScriptExecution = -1;
    };   

    migrationReport.totalBatchesCount = batchCount;
    logger.log(`========Migration Report==================`);  
    logger.log(migrationReport);    
}

migrate().then(()=>{
    logger.log("migrationScript finalized");    
    closeConnectionToDB().then(()=>{logger.log("connection closed")}); 
});



            // price = parsed.membership.price; unset.
            //{ "priceAtPurchase": { "$exists": 0 } }, unset.   
            //Add a summary OBJECT log, remaining transactions might be included.
            //such as execution time.
            //validate the parsed               


