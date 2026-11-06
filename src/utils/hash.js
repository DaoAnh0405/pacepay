const crypto = require('crypto');
//băm một chiều dùng cho otp và token phiên
exports.sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');