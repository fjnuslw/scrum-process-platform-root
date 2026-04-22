import express from "express";
import { BOARD_COLUMNS, STORY_STATUS } from "../constants/domain.js";
import { buildBurndownData, recordBurndownLog } from "../lib/burndown.js";
import {
  getNextId,
  now,
  readData,
  sortStories,
  writeData
} from "../lib/store.js";
import { fail, ok } from "../utils/response.js";

const router = express.Router();

function validateSprintPayload(payload) {
  if (!payload.name || !payload.startDate || !payload.endDate) {
    return "迭代名称和日期不能为空";
  }

  if (payload.startDate > payload.endDate) {
    return "开始日期不能晚于结束日期";
  }

  return null;
}

function enrichSprint(data, sprint) {
  const stories = data.stories.filter((story) => story.sprintId === sprint.id);
  return {
    ...sprint,
    storyCount: stories.length,
    totalPoints: Number(
      stories.reduce((sum, story) => sum + Number(story.storyPoints || 0), 0).toFixed(1)
    )
  };
}

router.get("/", (req, res) => {
  const data = readData();
  const sprints = data.sprints
    .map((sprint) => enrichSprint(data, sprint))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return ok(res, sprints);
});

router.get("/:id", (req, res) => {
  const data = readData();
  const id = Number(req.params.id);
  const sprint = data.sprints.find((item) => item.id === id);

  if (!sprint) {
    return fail(res, "迭代不存在", 404);
  }

  return ok(res, {
    ...enrichSprint(data, sprint),
    stories: sortStories(data.stories.filter((story) => story.sprintId === id))
  });
});

router.post("/", (req, res) => {
  const message = validateSprintPayload(req.body);
  if (message) {
    return fail(res, message);
  }

  const data = readData();
  const sprint = {
    id: getNextId(data, "sprint"),
    name: req.body.name.trim(),
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    goal: req.body.goal?.trim() || "",
    createdAt: now(),
    updatedAt: now()
  };

  data.sprints.push(sprint);
  writeData(data);
  return ok(res, enrichSprint(data, sprint), "创建成功");
});

router.put("/:id", (req, res) => {
  const message = validateSprintPayload(req.body);
  if (message) {
    return fail(res, message);
  }

  const data = readData();
  const id = Number(req.params.id);
  const sprint = data.sprints.find((item) => item.id === id);

  if (!sprint) {
    return fail(res, "迭代不存在", 404);
  }

  sprint.name = req.body.name.trim();
  sprint.startDate = req.body.startDate;
  sprint.endDate = req.body.endDate;
  sprint.goal = req.body.goal?.trim() || "";
  sprint.updatedAt = now();

  recordBurndownLog(data, sprint.id);
  writeData(data);
  return ok(res, enrichSprint(data, sprint), "更新成功");
});

router.delete("/:id", (req, res) => {
  const data = readData();
  const id = Number(req.params.id);
  const index = data.sprints.findIndex((item) => item.id === id);

  if (index === -1) {
    return fail(res, "迭代不存在", 404);
  }

  const [sprint] = data.sprints.splice(index, 1);

  data.stories = data.stories.map((story) =>
    story.sprintId === id
      ? {
          ...story,
          sprintId: null,
          status: STORY_STATUS.TODO,
          updatedAt: now()
        }
      : story
  );
  data.retrospectives = data.retrospectives.filter((item) => item.sprintId !== id);
  data.burndownLogs = data.burndownLogs.filter((item) => item.sprintId !== id);

  writeData(data);
  return ok(res, sprint, "删除成功");
});

router.post("/:id/stories", (req, res) => {
  const data = readData();
  const sprintId = Number(req.params.id);
  const sprint = data.sprints.find((item) => item.id === sprintId);

  if (!sprint) {
    return fail(res, "迭代不存在", 404);
  }

  if (!Array.isArray(req.body?.storyIds) || req.body.storyIds.length === 0) {
    return fail(res, "请选择要加入迭代的故事");
  }

  const storyIds = req.body.storyIds.map((id) => Number(id));
  const stories = data.stories.filter((story) => storyIds.includes(story.id));

  if (stories.length !== storyIds.length) {
    return fail(res, "存在无效的故事编号", 400);
  }

  for (const story of stories) {
    story.sprintId = sprintId;
    story.status = STORY_STATUS.TODO;
    story.updatedAt = now();
  }

  recordBurndownLog(data, sprintId);
  writeData(data);
  return ok(res, stories, "故事已加入迭代");
});

router.get("/:id/board", (req, res) => {
  const data = readData();
  const sprintId = Number(req.params.id);
  const sprint = data.sprints.find((item) => item.id === sprintId);

  if (!sprint) {
    return fail(res, "迭代不存在", 404);
  }

  const stories = sortStories(data.stories.filter((story) => story.sprintId === sprintId));
  const columns = BOARD_COLUMNS.map((column) => ({
    ...column,
    stories: stories.filter((story) => story.status === column.key)
  }));

  return ok(res, {
    sprint: enrichSprint(data, sprint),
    columns
  });
});

router.get("/:id/burndown", (req, res) => {
  const data = readData();
  const sprintId = Number(req.params.id);
  const burndown = buildBurndownData(data, sprintId);

  if (!burndown) {
    return fail(res, "迭代不存在", 404);
  }

  return ok(res, burndown);
});

router.post("/:id/burndown/recalculate", (req, res) => {
  const data = readData();
  const sprintId = Number(req.params.id);
  const sprint = data.sprints.find((item) => item.id === sprintId);

  if (!sprint) {
    return fail(res, "迭代不存在", 404);
  }

  recordBurndownLog(data, sprintId);
  writeData(data);

  return ok(res, buildBurndownData(data, sprintId), "燃尽图数据已重算");
});

export default router;
