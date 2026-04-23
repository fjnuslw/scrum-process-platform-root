import express from "express";
import backlogRouter from "./backlog.js";
import retrospectivesRouter from "./retrospectives.js";
import sprintsRouter from "./sprints.js";
import storiesRouter from "./stories.js";
import issuesRouter from "./issues.js";
import tasksRouter from "./tasks.js";
import { ok } from "../utils/response.js";

const router = express.Router();

router.get("/meta", (req, res) =>
  ok(res, {
    storyPoints: [0.5, 1, 2, 3, 5, 8, 20, 40]
  })
);
router.use("/stories", storiesRouter);
router.use("/backlog", backlogRouter);
router.use("/sprints", sprintsRouter);
router.use("/retrospectives", retrospectivesRouter);
issuesRouter(router);
tasksRouter(router);

export default router;
