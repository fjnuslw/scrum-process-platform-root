import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DEFAULT_FILE = path.join(ROOT_DIR, "data", "db.json");

const DEFAULT_STATE = {
  meta: {
    nextIds: {
      story: 1,
      sprint: 1,
      retrospective: 1,
      burndownLog: 1,
      issue: 1,
      task: 1
    }
  },
  stories: [],
  sprints: [],
  retrospectives: [],
  burndownLogs: [],
  issues: [],
  tasks: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveDataFile() {
  if (!process.env.DATA_FILE) {
    return DEFAULT_FILE;
  }

  return path.isAbsolute(process.env.DATA_FILE)
    ? process.env.DATA_FILE
    : path.resolve(ROOT_DIR, process.env.DATA_FILE);
}

function ensureDataFile() {
  const file = resolveDataFile();
  const dir = path.dirname(file);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
  }

  return file;
}

export function readData() {
  const file = ensureDataFile();
  const content = fs.readFileSync(file, "utf8");
  const parsed = content ? JSON.parse(content) : clone(DEFAULT_STATE);

  return {
    ...clone(DEFAULT_STATE),
    ...parsed,
    meta: {
      ...clone(DEFAULT_STATE.meta),
      ...(parsed.meta || {}),
      nextIds: {
        ...clone(DEFAULT_STATE.meta.nextIds),
        ...(parsed.meta?.nextIds || {})
      }
    },
    stories: parsed.stories || [],
    sprints: parsed.sprints || [],
    retrospectives: parsed.retrospectives || [],
    burndownLogs: parsed.burndownLogs || [],
    issues: parsed.issues || [],
    tasks: parsed.tasks || []
  };
}

export function writeData(data) {
  const file = ensureDataFile();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function resetData() {
  writeData(clone(DEFAULT_STATE));
}

export function getNextId(data, key) {
  const current = data.meta.nextIds[key] || 1;
  data.meta.nextIds[key] = current + 1;
  return current;
}

export function sortStories(stories) {
  return [...stories].sort((a, b) => {
    if (a.priorityOrder !== b.priorityOrder) {
      return a.priorityOrder - b.priorityOrder;
    }

    return a.id - b.id;
  });
}

export function now() {
  return new Date().toISOString();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyState() {
  return clone(DEFAULT_STATE);
}
