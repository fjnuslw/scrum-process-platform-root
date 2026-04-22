import express from "express";
import { getNextId, now, readData, writeData } from "../lib/store.js";
import { fail, ok } from "../utils/response.js";

const router = express.Router();

function validatePayload(payload) {
  const fields = ["good1", "good2", "good3", "improve1", "improve2", "improve3"];
  const missing = fields.find((field) => !payload[field] || !String(payload[field]).trim());
  if (!payload.sprintId) {
    return "请选择所属迭代";
  }
  if (missing) {
    return "回顾内容需要填写完整";
  }
  return null;
}

router.get("/", (req, res) => {
  const data = readData();
  const items = data.retrospectives
    .map((item) => {
      const sprint = data.sprints.find((sprintItem) => sprintItem.id === item.sprintId);
      return {
        ...item,
        sprintName: sprint?.name || `Sprint ${item.sprintId}`
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return ok(res, items);
});

router.get("/:sprintId", (req, res) => {
  const data = readData();
  const sprintId = Number(req.params.sprintId);
  const item = data.retrospectives.find((retrospective) => retrospective.sprintId === sprintId);

  return ok(res, item || null);
});

router.post("/", (req, res) => {
  const message = validatePayload(req.body || {});
  if (message) {
    return fail(res, message);
  }

  const data = readData();
  const sprintId = Number(req.body.sprintId);
  const sprint = data.sprints.find((item) => item.id === sprintId);

  if (!sprint) {
    return fail(res, "迭代不存在", 404);
  }

  let item = data.retrospectives.find((retrospective) => retrospective.sprintId === sprintId);

  if (item) {
    item.good1 = req.body.good1.trim();
    item.good2 = req.body.good2.trim();
    item.good3 = req.body.good3.trim();
    item.improve1 = req.body.improve1.trim();
    item.improve2 = req.body.improve2.trim();
    item.improve3 = req.body.improve3.trim();
    item.updatedAt = now();
  } else {
    item = {
      id: getNextId(data, "retrospective"),
      sprintId,
      good1: req.body.good1.trim(),
      good2: req.body.good2.trim(),
      good3: req.body.good3.trim(),
      improve1: req.body.improve1.trim(),
      improve2: req.body.improve2.trim(),
      improve3: req.body.improve3.trim(),
      createdAt: now(),
      updatedAt: now()
    };
    data.retrospectives.push(item);
  }

  writeData(data);
  return ok(res, item, "回顾已保存");
});

router.put("/:id", (req, res) => {
  const data = readData();
  const id = Number(req.params.id);
  const item = data.retrospectives.find((retrospective) => retrospective.id === id);

  if (!item) {
    return fail(res, "回顾不存在", 404);
  }

  const payload = {
    ...item,
    ...req.body,
    sprintId: item.sprintId
  };
  const message = validatePayload(payload);
  if (message) {
    return fail(res, message);
  }

  item.good1 = payload.good1.trim();
  item.good2 = payload.good2.trim();
  item.good3 = payload.good3.trim();
  item.improve1 = payload.improve1.trim();
  item.improve2 = payload.improve2.trim();
  item.improve3 = payload.improve3.trim();
  item.updatedAt = now();

  writeData(data);
  return ok(res, item, "更新成功");
});

export default router;
