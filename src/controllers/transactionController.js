const txService = require('../services/transactionService');
const { formatVND } = require('../utils/money');
const { describe } = require('../utils/txView');

function respond(res, result, label) {
  const tx = result.transaction;
  const balanceAfter = tx.type === 'deposit' ? tx.to_balance_after : tx.from_balance_after;
  res.status(result.replayed ? 200 : 201).json({
    success: true,
    message: result.replayed ? 'Giao dịch này đã được xử lý trước đó' : `${label} thành công`,
    data: {
      reference: tx.reference_code,
      amount: Number(tx.amount),
      balanceText: formatVND(balanceAfter),
    },
  });
}

exports.deposit = async (req, res) => {
  respond(res, await txService.deposit(req.user.id, req.body), 'Nạp tiền');
};

exports.withdraw = async (req, res) => {
  respond(res, await txService.withdraw(req.user.id, req.body), 'Rút tiền');
};

exports.transfer = async (req, res) => {
  respond(res, await txService.transfer(req.user.id, req.body), 'Chuyển tiền');
};

exports.historyPage = async (req, res) => {
  const q = req.validated;
  const result = await txService.history(req.user.id, q);

  // tạo chuỗi truy vấn cho nút trước/sau, giữ nguyên bộ lọc
  const qs = (page) => {
    const p = new URLSearchParams({ page });
    if (q.type) p.set('type', q.type);
    if (q.from) p.set('from', q.from);
    if (q.to) p.set('to', q.to);
    return p.toString();
  };

  res.render('pages/transactions', {
    title: 'Lịch sử',
    result,
    filters: q,
    qs,
    formatVND,
    describe,
  });
};