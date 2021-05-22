import argparse
import subprocess
import logging
import re
import os
import json
from dataclasses import dataclass
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO)

log = logging.getLogger("runner")

parser = argparse.ArgumentParser()
parser.add_argument("--repo", dest="repo", type=str, required=True, help="The repo to test and run TASER on")

@dataclass
class CommandExecutor:
    name: str
    command: List[str]
    env: Dict[str, Any] = None

    def run(self):
        log.info("Executing '%s'. Command being executed [%s]", self.name, " ".join(self.command))
        subprocess.run(self.command, check=True, env=self.env)


class GitCloneExecutor(CommandExecutor):
    def __init__(self, repo: str):
        self.name = "GitClone"
        self.command = ["git", "clone", repo]

class NpmExecutor(CommandExecutor):
    def __init__(self, target: str):
        self.name = "Npm" + target.capitalize()
        self.command = ["npm", target]


def git_clone(repo: str) -> str:
    cloned_repo_dir = re.findall("github\.com/.+/(.+)\.git", repo)[0] 
    git_clone_args = ["git", "clone", repo]
    log.info("Clonning repo: %s into dir: %s/", repo, cloned_repo_dir)
    subprocess.run(git_clone_args, check=True)
    return cloned_repo_dir

def npm_run(base_dir: str, command: str):
    npm_args = ["npm", command]
    log.info("Running `npm %s`", command)
    subprocess.run(npm_args, cwd=base_dir, check=True)

def taser_run(base_dir: str):
    # Parse npm module name
    with open(os.path.join(base_dir, "package.json"), "r") as f:
        j = json.load(f)
        package_name = j["name"]
    """
    LIBRARY_ROOT_PATH=`pwd`
    POLICY_FILE="/persistent2/tsm-setup/taser/src/DefaultPolicy.js"
    POLICY_OUT="model.json"
    LIBRARY_UNDER_TEST="dynamodb"
    mx -p /persistent2/tsm-setup/workspace-nodeprof/nodeprof.js jalangi --scope=module --analysis /persistent2/tsm-setup/taser/src/AintNodeTaint.js node_modules/mocha/bin/mocha test/
    """
    env = {
        "LIBRARY_ROOT_PATH": base_dir,
        "POLICY_FILE": "/persistent2/tsm-setup/taser/src/DefaultPolicy.js",
        "POLICY_OUT": os.path.join(base_dir, "model.json"),
        "LIBRARY_UNDER_TEST": package_name,
        "JAVA_HOME": "/home/pbalbi/opt/openjdk1.8.0_172-jvmci-0.46",
        "PATH": os.environ["PATH"]
    }
    taser_args = ["/home/pbalbi/repos/mx/mx", "-p", "/persistent2/tsm-setup/workspace-nodeprof/nodeprof.js",
        "jalangi", "--analysis", "/persistent2/tsm-setup/taser/src/AintNodeTaint.js",
        "node_modules/mocha/bin/mocha", "test/"
    ]
    subprocess.run(taser_args, cwd=base_dir, env=env, check=True)

def main():
    args = parser.parse_args()

    cloned_repo_name = re.findall("github\.com/.+/(.+)\.git", args.repo)[0] 

    git_clone(args.repo)

    full_repo_dir = os.path.join(os.getcwd(), cloned_repo_name)
    # LIBRARY_ROOT_PATH=`pwd` POLICY_FILE="/persistent2/tsm-setup/taser/src/DefaultPolicy.js" POLICY_OUT="model.json" LIBRARY_UNDER_TEST="dynamodb" mx -p /persistent2/tsm-setup/workspace-nodeprof/nodeprof.js jalangi --scope=module --analysis /persistent2/tsm-setup/taser/src/AintNodeTaint.js node_modules/mocha/bin/mocha test/

    npm_run(full_repo_dir, "install")
    npm_run(full_repo_dir, "test")

    taser_run(full_repo_dir)

if __name__ == "__main__":
    main()