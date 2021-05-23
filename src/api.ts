import express from "express";
import morgan from "morgan";
import cors from "cors";
import { issueDefaultJob, issueJob, walkJobs } from "./stores";

let app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/jobs", async (req, res) => {
    res.status(200).json(
        Array.from(walkJobs()).map(jobEntry => jobEntry.value)
    );
});

app.post("/jobs", async (req, res) => {
    let repo: string = req.body.repo;
    console.log("Received POST /jobs with repo=[%s]", repo);
    issueDefaultJob(repo)
        .catch(() => res.status(500).send())
        .then(jobId => {
            res.status(201).json({id: jobId});
        });
});

app.listen(8080, () => {
    console.log("API server started!");
})