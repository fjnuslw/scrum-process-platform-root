export function ok(res, data = {}, message = "ok") {
  return res.json({
    code: 0,
    message,
    data
  });
}

export function fail(res, message = "参数错误", status = 400, data = null) {
  return res.status(status).json({
    code: 1,
    message,
    data
  });
}
