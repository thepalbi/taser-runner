import { walkJobs } from "./stores";

const workDelayMs = 5000;

function doWork() {
    console.log("Checking pending jobs");
    
    for (let {key, value} of walkJobs()) {
        console.log("Found job with timestamp %d named %s", key, value.name);
    }
    setTimeout(doWork, workDelayMs);
}

console.log("Starting worker!");

doWork();