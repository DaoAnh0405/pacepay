const AppError = require('./AppError');

module.exports = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,   // gom mọi lỗi, không dừng ở lỗi đầu
    stripUnknown: true,  // bỏ trường lạ người dùng gửi thừa
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(new AppError(details[0].message, 400, details));
  }

  req.body = value; // dữ liệu đã làm sạch, ép kiểu
  next();
};