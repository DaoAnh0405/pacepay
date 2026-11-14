// Câu mô tả giao dịch theo góc nhìn của người dùng hiện tại
exports.describe = (t) => {
  if (t.type === 'deposit') return 'Nạp tiền vào ví';
  if (t.type === 'withdraw') return 'Rút tiền';
  return t.direction === 'out' ? `Chuyển tiền tới ${t.to_name}` : `Nhận tiền từ ${t.from_name}`;
};