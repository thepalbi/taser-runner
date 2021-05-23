import {open} from "lmdb-store";

let jobsStore = open({
    path: "db/jobs.db",
    compression: true
});

export function walkJobs(): Iterable<{key: number, value: JobProps}> {
    return jobsStore.getRange({start: 0, end: Number.POSITIVE_INFINITY})
        .map(({key, value}) => {
            let keyAsNum = key as number;
            let valueAsJobProps = value as JobProps;
            return {key: keyAsNum, value: valueAsJobProps};
        });
}

interface JobProps {
    name: string,
    repo: string,
}

export async function issueJob(props: JobProps) {
    await jobsStore.put(Date.now(), props);
}