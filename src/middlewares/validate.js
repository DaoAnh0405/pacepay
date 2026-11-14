const AppError = require('../utils/AppError');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(new AppError(details[0].message, 400, details));
  }

  if (source === 'body') req.body = value;
  else req.validated = value;
  next();
};
