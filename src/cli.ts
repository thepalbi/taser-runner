import arg from "arg";
import { isAbsolute, join } from "path";
import { extractFromRepoUrl, GitCloneExecutor, NpmExecutor, runCommandExecutorsChain, TaserExecutor } from ".";
import { issueJob } from "./stores";
import fs from "fs";

const args = arg({
    "--help": Boolean,
    "--list-commands": Boolean,
    "--run": Boolean,
    "--issue": Boolean,
    "--repo": String,
    "--wd": String
});

if (args["--help"]) {
    console.log(`TASER runner

Options:
--help: Get some help
--list-commands: List the available commands
--run: Run all commands
--issue: Issues a new job to be ran


Arguments (R stands for required, if not optional):
--repo: R The repo to download and run TASER on
--wd: R The absolute path to the working directory`);
    process.exit(0);
}

const repo = args["--repo"];
const wd = args["--wd"];


if (repo == undefined || wd == undefined)
    throw new Error("--repo is required");

if (!isAbsolute(wd)) {
    throw new Error("--wd has to be an absolute path");
}

const { repoName, repoAuthor } = extractFromRepoUrl(repo);
const clonePath = join(wd, `${repoAuthor}-${repoName}`);
const npmPackageName = extractNpmPackageName(clonePath);
const taserModelFilePath = join(clonePath, "model.json");

let commands = [
    new GitCloneExecutor(repo, clonePath),
    new NpmExecutor("install", clonePath),
    new NpmExecutor("test", clonePath),
    new TaserExecutor(clonePath, npmPackageName, taserModelFilePath)
];

const commandNames = commands.map(command => command.name);

if (args["--list-commands"]) {
    console.log("Available commands: %s", commandNames.join(", "));
    process.exit(0);
}

if (args["--issue"]) {
    console.log("Issuing job to be ran")
    const iat = Date.now();
    issueJob({
        issuedAt: iat,
        name: `TaserJob-${repoAuthor}-${repoName}`,
        repo: repo,
        status: "pending"
    })
        .then(() => console.log("Job issued with id=[%d]!", iat));
} else if (args["--run"]) {
    console.log("Executing all commands: %s", commandNames.join(", "));
    runCommandExecutorsChain(commands);
}

function extractNpmPackageName(clonePath: string): string {
    const packageJsonPath = join(clonePath, "package.json");
    let textContents = fs.readFileSync(packageJsonPath, "utf-8");
    return JSON.parse(textContents).name;
}
