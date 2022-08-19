import {createWriteStream} from "fs";
import {Console} from "console";
import {join} from 'path';

const output = createWriteStream(join(__dirname,'stdout.log'),{'flags': 'a'});
const errorOutput = createWriteStream(join(__dirname , 'stderr.log'),{'flags': 'a'});
const fileLogger = new Console(output, errorOutput);
//**This logger is only to be used for local logging purposes, do not confuse with Sentry logger**/
class ScriptLogger{
    log = (...args)=>{
        const now = `[${new Date().toLocaleString()}]`;
        try{
            fileLogger.log(now, ...args);
        }finally{            
        }
        console.log(now, ...args);
    }
}

export const logger = new ScriptLogger();