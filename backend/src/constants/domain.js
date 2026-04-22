export const STORY_POINTS = [0.5, 1, 2, 3, 5, 8, 20, 40];
export const STORY_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done"
};
export const STORY_STATUS_OPTIONS = Object.values(STORY_STATUS);

export const BOARD_COLUMNS = [
  { key: STORY_STATUS.TODO, label: "未开始" },
  { key: STORY_STATUS.IN_PROGRESS, label: "进行中" },
  { key: STORY_STATUS.DONE, label: "已完成" }
];

export const BACKLOG_FILTER = {
  ALL: "all",
  PENDING: "pending"
};
