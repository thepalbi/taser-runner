import arg from "arg";
import { isAbsolute, join } from "path";
import { CommandExecutor, GitCloneExecutor, NpmExecutor } from ".";

const args = arg({
    "--help": Boolean,
    "--list-commands": Boolean,
    "--run": Boolean,
    "--repo": String,
    "--wd": String
});

if (args["--help"]) {
    console.log(`TASER runner

Options:
--help: Get some help
--list-commands: List the available commands
--run: Run all commands

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

function extractFromRepoUrl(url: string): { repoName: string, repoAuthor: string } {
    let extraction = url.match(/github\.com\/(?<repoAuthor>.+)\/(?<repoName>.+)\.git/);
    if (extraction?.groups == undefined)
        throw new Error("Could't extract repoName and repoAuthor from url");
    return {
        repoName: extraction.groups.repoName,
        repoAuthor: extraction.groups.repoAuthor
    }
}

const { repoName, repoAuthor } = extractFromRepoUrl(repo);
const clonePath = join(wd, `${repoAuthor}-${repoName}`);

let commands = [
    new GitCloneExecutor(repo, clonePath),
    new NpmExecutor("install", clonePath),
    new NpmExecutor("test", clonePath)
];

const commandNames = commands.map(command => command.name);

if (args["--list-commands"]) {
    console.log("Available commands: %s", commandNames.join(", "));
    process.exit(0);
}

if (args["--run"]) {
    console.log("Executing all commands: %s", commandNames.join(", "));
    (async () => {
        await commands[0].run();
    })();
}
