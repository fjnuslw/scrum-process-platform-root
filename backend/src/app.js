import cors from "cors";
import express from "express";
import apiRouter from "./routes/index.js";
import { fail, ok } from "./utils/response.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => ok(res, { status: "ok" }));
app.use("/api", apiRouter);

app.use((req, res) => fail(res, "接口不存在", 404));

app.use((error, req, res, next) => {
  console.error(error);
  return fail(res, "服务器内部错误", 500);
});

export default app;
