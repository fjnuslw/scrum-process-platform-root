import { STORY_STATUS } from "../constants/domain.js";
import { getNextId, now, today } from "./store.js";

function roundPoint(value) {
  return Number.parseFloat(Number(value).toFixed(1));
}

function listDates(startDate, endDate) {
  const result = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function getSprintStories(data, sprintId) {
  return data.stories.filter((story) => story.sprintId === sprintId);
}

function getTotalPoints(stories) {
  return roundPoint(
    stories.reduce((sum, story) => sum + Number(story.storyPoints || 0), 0)
  );
}

function getRemainingPoints(stories) {
  return roundPoint(
    stories
      .filter((story) => story.status !== STORY_STATUS.DONE)
      .reduce((sum, story) => sum + Number(story.storyPoints || 0), 0)
  );
}

export function recordBurndownLog(data, sprintId, date = today()) {
  const sprint = data.sprints.find((item) => item.id === sprintId);
  if (!sprint) {
    return null;
  }

  const stories = getSprintStories(data, sprintId);
  const remainingPoints = getRemainingPoints(stories);
  const existing = data.burndownLogs.find(
    (item) => item.sprintId === sprintId && item.date === date
  );

  if (existing) {
    existing.remainingPoints = remainingPoints;
    existing.createdAt = existing.createdAt || now();
    return existing;
  }

  const log = {
    id: getNextId(data, "burndownLog"),
    sprintId,
    date,
    remainingPoints,
    createdAt: now()
  };

  data.burndownLogs.push(log);
  return log;
}

export function buildBurndownData(data, sprintId) {
  const sprint = data.sprints.find((item) => item.id === sprintId);
  if (!sprint) {
    return null;
  }

  const stories = getSprintStories(data, sprintId);
  const totalPoints = getTotalPoints(stories);
  const dates = listDates(sprint.startDate, sprint.endDate);
  const logs = data.burndownLogs
    .filter((item) => item.sprintId === sprintId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const planned = dates.map((date, index) => {
    if (dates.length === 1) {
      return {
        date,
        remaining: totalPoints
      };
    }

    const step = totalPoints / (dates.length - 1);
    return {
      date,
      remaining: roundPoint(Math.max(totalPoints - step * index, 0))
    };
  });

  let currentRemaining = totalPoints;
  const actual = dates.map((date) => {
    const dailyLog = logs.find((item) => item.date === date);
    if (dailyLog) {
      currentRemaining = roundPoint(dailyLog.remainingPoints);
    }

    return {
      date,
      remaining: currentRemaining
    };
  });

  return {
    sprintId,
    totalPoints,
    planned,
    actual
  };
}
