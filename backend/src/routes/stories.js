import express from "express";
import { STORY_POINTS, STORY_STATUS, STORY_STATUS_OPTIONS } from "../constants/domain.js";
import { recordBurndownLog } from "../lib/burndown.js";
import {
  getNextId,
  now,
  readData,
  sortStories,
  writeData
} from "../lib/store.js";
import { fail, ok } from "../utils/response.js";

const router = express.Router();

function normalizeStory(story) {
  return {
    ...story,
    storyPoints: Number(story.storyPoints)
  };
}

function validateStoryPayload(payload) {
  if (!payload.title || !payload.description) {
    return "标题和描述不能为空";
  }

  if (!STORY_POINTS.includes(Number(payload.storyPoints))) {
    return "故事点数不合法";
  }

  return null;
}

router.get("/", (req, res) => {
  const data = readData();
  const { status, sprintId, keyword } = req.query;

  let stories = data.stories;

  if (status) {
    stories = stories.filter((story) => story.status === status);
  }

  if (sprintId !== undefined) {
    const parsedSprintId = sprintId === "null" ? null : Number(sprintId);
    stories = stories.filter((story) => story.sprintId === parsedSprintId);
  }

  if (keyword) {
    const term = String(keyword).trim().toLowerCase();
    stories = stories.filter(
      (story) =>
        story.title.toLowerCase().includes(term) ||
        story.description.toLowerCase().includes(term)
    );
  }

  return ok(res, sortStories(stories).map(normalizeStory));
});

router.post("/", (req, res) => {
  const message = validateStoryPayload(req.body);
  if (message) {
    return fail(res, message);
  }

  const data = readData();
  const maxPriority = data.stories.reduce(
    (max, story) => Math.max(max, story.priorityOrder),
    0
  );

  const story = {
    id: getNextId(data, "story"),
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    storyPoints: Number(req.body.storyPoints),
    priorityOrder: maxPriority + 1,
    status: STORY_STATUS.TODO,
    sprintId: null,
    createdAt: now(),
    updatedAt: now()
  };

  data.stories.push(story);
  writeData(data);
  return ok(res, normalizeStory(story), "创建成功");
});

router.put("/:id", (req, res) => {
  const message = validateStoryPayload(req.body);
  if (message) {
    return fail(res, message);
  }

  const data = readData();
  const id = Number(req.params.id);
  const story = data.stories.find((item) => item.id === id);

  if (!story) {
    return fail(res, "故事不存在", 404);
  }

  story.title = req.body.title.trim();
  story.description = req.body.description.trim();
  story.storyPoints = Number(req.body.storyPoints);
  story.updatedAt = now();

  if (story.sprintId) {
    recordBurndownLog(data, story.sprintId);
  }

  writeData(data);
  return ok(res, normalizeStory(story), "更新成功");
});

router.delete("/:id", (req, res) => {
  const data = readData();
  const id = Number(req.params.id);
  const storyIndex = data.stories.findIndex((item) => item.id === id);

  if (storyIndex === -1) {
    return fail(res, "故事不存在", 404);
  }

  const [story] = data.stories.splice(storyIndex, 1);

  if (story.sprintId) {
    recordBurndownLog(data, story.sprintId);
  }

  data.stories = sortStories(data.stories).map((item, index) => ({
    ...item,
    priorityOrder: index + 1
  }));

  writeData(data);
  return ok(res, normalizeStory(story), "删除成功");
});

router.patch("/reorder", (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, "排序数据不能为空");
  }

  const data = readData();
  const map = new Map(items.map((item) => [Number(item.id), Number(item.priorityOrder)]));

  for (const story of data.stories) {
    if (map.has(story.id)) {
      story.priorityOrder = map.get(story.id);
      story.updatedAt = now();
    }
  }

  data.stories = sortStories(data.stories).map((story, index) => ({
    ...story,
    priorityOrder: index + 1
  }));

  writeData(data);
  return ok(res, data.stories.map(normalizeStory), "排序已保存");
});

router.patch("/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!STORY_STATUS_OPTIONS.includes(status)) {
    return fail(res, "状态不合法");
  }

  const data = readData();
  const id = Number(req.params.id);
  const story = data.stories.find((item) => item.id === id);

  if (!story) {
    return fail(res, "故事不存在", 404);
  }

  story.status = status;
  story.updatedAt = now();

  if (story.sprintId) {
    recordBurndownLog(data, story.sprintId);
  }

  writeData(data);
  return ok(res, normalizeStory(story), "状态已更新");
});

router.patch("/:id/sprint", (req, res) => {
  const data = readData();
  const id = Number(req.params.id);
  const story = data.stories.find((item) => item.id === id);

  if (!story) {
    return fail(res, "故事不存在", 404);
  }

  const oldSprintId = story.sprintId;
  const sprintId =
    req.body?.sprintId === null || req.body?.sprintId === ""
      ? null
      : Number(req.body?.sprintId);

  if (sprintId !== null) {
    const sprint = data.sprints.find((item) => item.id === sprintId);
    if (!sprint) {
      return fail(res, "迭代不存在", 404);
    }
  }

  story.sprintId = Number.isNaN(sprintId) ? null : sprintId;
  story.status = STORY_STATUS.TODO;
  story.updatedAt = now();

  if (oldSprintId) {
    recordBurndownLog(data, oldSprintId);
  }
  if (story.sprintId) {
    recordBurndownLog(data, story.sprintId);
  }

  writeData(data);
  return ok(res, normalizeStory(story), "迭代归属已更新");
});

export default router;
