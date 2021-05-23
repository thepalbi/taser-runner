import { open } from "lmdb-store";
import { extractFromRepoUrl } from ".";

type JobStatus = "pending" | "working" | "done" | "failed";

export interface JobProps {
    issuedAt: number,
    name: string,
    repo: string,
    status: JobStatus
}

export interface FinishedJobProps extends JobProps {
    error: string
}

let jobsStore = open({
    path: "db/jobs.db",
    compression: true
});

type JobFilter = (job: JobProps) => Boolean;

export function walkJobs(filter?: JobFilter): Iterable<{ key: number, value: JobProps }> {
    let doFilter = filter == undefined ? () => true : filter;
    return jobsStore.getRange({ start: 0, end: Number.POSITIVE_INFINITY })
        .map(({ key, value }) => {
            let keyAsNum = key as number;
            let valueAsJobProps = value as JobProps;
            return { key: keyAsNum, value: valueAsJobProps };
        })
        .filter(jobEntry => doFilter(jobEntry.value));
}

export function markTaken(id: number, props: JobProps) {
    props.status = "working";
    jobsStore.putSync(id, props);
}

export async function updateJob(id: number, job: JobProps | FinishedJobProps) {
    jobsStore.put(id, job);
}

export async function issueDefaultJob(repo: string) {
    let now = Date.now();
    const { repoName, repoAuthor } = extractFromRepoUrl(repo);
    let job: JobProps = {
        issuedAt: now,
        name: `TaserJob-${repoAuthor}-${repoName}`,
        repo: repo,
        status: "pending"
    };
    await jobsStore.put(now, job);
    return now;
}

export async function issueJob(props: JobProps) {
    await jobsStore.put(props.issuedAt, props);
}