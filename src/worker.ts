import { walkJobs } from "./stores";

const workDelayMs = 5000;

function pollJobsDb() {
    console.log("Checking pending jobs");
    
    for (let {key, value} of walkJobs(job => job.status == "pending")) {
        console.log("Found job with timestamp %d named %s", key, value.name);
    }
    setTimeout(pollJobsDb, workDelayMs);
}

console.log("Starting worker!");

pollJobsDb();