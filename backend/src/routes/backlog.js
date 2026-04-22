import express from "express";
import { BACKLOG_FILTER, STORY_STATUS } from "../constants/domain.js";
import { readData, sortStories } from "../lib/store.js";
import { ok } from "../utils/response.js";

const router = express.Router();

router.get("/", (req, res) => {
  const data = readData();
  const filter = req.query.filter || BACKLOG_FILTER.ALL;

  let stories = data.stories.filter((story) => story.sprintId === null);

  if (filter === BACKLOG_FILTER.PENDING) {
    stories = stories.filter((story) => story.status !== STORY_STATUS.DONE);
  }

  return ok(
    res,
    sortStories(stories).map((story) => ({
      ...story,
      storyPoints: Number(story.storyPoints)
    }))
  );
});

export default router;
