import { exec } from 'child_process';

export class CommandExecutor {
    name: string;
    command: string[];
    env: { [key: string]: any; };
    wd?: string;

    constructor(name: string, command: string[], env?: { [key: string]: any }, wd?: string) {
        this.name = name;
        this.command = command;
        this.env = env == undefined ? {} : env;
        this.wd = wd;
    }

    run(): Promise<string> {
        let joinedCommand = this.command.join(" ");
        let execOptions = {
            // Compose custom environment variables with process ones
            env: { ...process.env, ...this.env },
            cwd: this.wd
        }
        return new Promise((resolve, reject) => {
            console.log("Executing %s. Command being executed [%s].", this.name, joinedCommand);

            exec(joinedCommand, execOptions, (err, stdout, stderr) => {
                if (err == null) {
                    resolve(stdout);
                }

                console.error("Error executing %s. STDERR:\n%s\nSTDOUT:\n%s\n", this.name, stderr, stdout);
                reject(new Error("error executing " + this.name))
            })
        });
    }
}

export class GitCloneExecutor extends CommandExecutor {
    constructor(repo: string, cloneDir: string) {
        super("GitClone", ["git", "clone", repo, cloneDir]);
    }
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export class NpmExecutor extends CommandExecutor {
    constructor(target: string, projectDir: string) {
        super("Npm" + capitalize(target), ["npm", target], undefined, projectDir);
    }
}

export class TaserExecutor extends CommandExecutor {
    constructor(projectDir: string, packageName: string, modelFilePath: string) {
        // TODO: This just runs mocha test suites. Generalize?
        let env = {
            // TODO: Extract all taser specific configs
            "LIBRARY_ROOT_PATH": projectDir,
            "POLICY_FILE": "/persistent2/tsm-setup/taser/src/DefaultPolicy.js",
            "POLICY_OUT": modelFilePath,
            "LIBRARY_UNDER_TEST": packageName,
            "JAVA_HOME": "/home/pbalbi/opt/openjdk1.8.0_172-jvmci-0.46"
        }
        super("Taser",
            ["/home/pbalbi/repos/mx/mx", "-p", "/persistent2/tsm-setup/workspace-nodeprof/nodeprof.js",
                "jalangi", "--analysis", "/persistent2/tsm-setup/taser/src/AintNodeTaint.js",
                "node_modules/mocha/bin/mocha", "test/"], env, projectDir);
    }
}