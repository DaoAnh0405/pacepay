const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const config = require('./config/env');
const routes = require('./routes');
const userModel = require('./models/userModel');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet());
app.use(cors());
app.use(compression());
if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// cho mọi view biết user (null nếu chưa đăng nhập)
app.use(async (req, res, next) => {
  res.locals.user = null;
  const token = req.cookies.token;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      const u = await userModel.findById(payload.id);
      if (u && u.status === 'active') res.locals.user = u;
    } catch {
      // token sai/hết hạn coi như chưa đăng nhập
    }
  }
  next();
});

app.use(globalLimiter);
app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;