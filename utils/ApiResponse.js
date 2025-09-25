class ApiResponse {
  constructor(statusCode, data, message) {
    this.statusCode = Number(statusCode) || 200;
    this.data = data;
    if (message) this.message = message;
  }

  static success(res, data, statusCode = 200) {
    return res.status(statusCode).json(data);
  }

  static created(res, data) {
    return this.success(res, data, 201);
  }

  static message(res, message, statusCode = 200) {
    return res.status(statusCode).json({ message });
  }
}

module.exports = ApiResponse;


