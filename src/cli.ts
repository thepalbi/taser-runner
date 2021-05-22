import arg from "arg";

const args = arg({
    "--help": Boolean,
    "--list-commands": Boolean,
    "--repo": String,
    "--wd": String
});

if (args["--help"]) {
    console.log(`TASER runner

Options:
--help: Get some help
--list-commands: List the available commands

Arguments (R stands for required, if not optional):
--repo: R The repo to download and run TASER on
--wd: R The absolute path to the workind directory`);
    process.exit(0);
}

const repo = args["--repo"];
const wd = args["--wd"];


if (repo == undefined || wd == undefined) 
    throw new Error("--repo is required");


