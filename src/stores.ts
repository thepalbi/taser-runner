import { open } from "lmdb-store";

type JobStatus = "pending" | "working" | "done" | "failed";

export interface JobProps {
    name: string,
    repo: string,
    status: JobStatus
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

export async function issueJob(props: JobProps) {
    await jobsStore.put(Date.now(), props);
}