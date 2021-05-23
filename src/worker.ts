import arg from "arg";
import { join, isAbsolute } from "path";
import { extractFromRepoUrl, GitCloneExecutor, NpmExecutor, runCommandExecutorsChain } from ".";
import { FinishedJobProps, issueJob, JobProps, markTaken, updateJob, walkJobs } from "./stores";

const args = arg({
    "--wd": String
});


if (!args["--wd"] || !isAbsolute(args["--wd"])) {
    throw new Error("--wd is required, and needs to be the wokers working directory absolute path");
}

const workDelayMs = 5000;
const wd = args["--wd"];

async function doWork(id: number, job: JobProps) {
    const { repoName, repoAuthor } = extractFromRepoUrl(job.repo);
    const clonePath = join(wd, `${repoAuthor}-${repoName}`);

    let commands = [
        new GitCloneExecutor(job.repo, clonePath),
        new NpmExecutor("install", clonePath),
        new NpmExecutor("test", clonePath)
    ];

    try {
        console.log("Starting work on job id=[%d] name=[%s]", id, job.name);
        await runCommandExecutorsChain(commands);
    } catch (err) {
        console.error("Job id=[%d] failed", id);
        let failedJob: FinishedJobProps = {
            ...job,
            status: "failed",
            error: JSON.stringify(err)
        };
        await updateJob(id, failedJob);
    }

    job.status = "done";
    await updateJob(id, job);
}

function pollJobsDb() {
    console.log("Checking pending jobs");
    
    for (let {key: id, value: job} of walkJobs(job => job.status == "pending")) {
        console.log("Found job with timestamp %d named %s", id, job.name);
        // Synchronously mark job as taken
        markTaken(id, job);
        doWork(id, job);
    }
    setTimeout(pollJobsDb, workDelayMs);
}

console.log("Starting worker!");

pollJobsDb();