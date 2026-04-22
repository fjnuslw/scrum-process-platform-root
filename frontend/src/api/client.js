import axios from "axios";
import { ElMessage } from "element-plus";

const client = axios.create({
  baseURL: "/api",
  timeout: 10000
});

client.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload.code === 0) {
      return payload.data;
    }

    ElMessage.error(payload.message || "请求失败");
    return Promise.reject(new Error(payload.message || "请求失败"));
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || "网络请求失败";
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default client;
