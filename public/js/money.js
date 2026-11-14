(function () {
  // form nào -> gửi tới API nào
  const FORMS = {
    'deposit-form': '/api/transactions/deposit',
    'withdraw-form': '/api/transactions/withdraw',
    'transfer-form': '/api/transactions/transfer',
  };

  // mã duy nhất cho mỗi lần thao tác (idempotency key)
  function newKey() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12) +
      Math.random().toString(36).slice(2, 12);
  }

  // phải khai báo trước vòng lặp bên dưới
  const otpBox = document.getElementById('otp-box');

  function needsOtp(err) {
    return (err.details && err.details.code === 'OTP_REQUIRED') ||
      /mã xác nhận SMS/.test(err.message);
  }

  Object.keys(FORMS).forEach((id) => {
    const form = document.getElementById(id);
    if (!form) return;

    let key = newKey();
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.amount = Number(data.amount);
      data.idempotencyKey = key;
      if (!data.otp) delete data.otp;   // ô trống thì không gửi
      if (!data.note) delete data.note;

      button.disabled = true; // chặn bấm đúp
      try {
        const body = await postJson(FORMS[id], data);
        showMessage(
          `${body.message}. Mã giao dịch: ${body.data.reference}. Số dư sau giao dịch: ${body.data.balanceText}`,
          false,
        );
        form.reset();
        key = newKey(); // giao dịch xong mới đổi key
        if (otpBox) otpBox.hidden = true;
      } catch (err) {
        // thất bại thì GIỮ NGUYÊN key: bấm lại không sợ bị trừ hai lần
        if (otpBox && needsOtp(err)) {
          otpBox.hidden = false;
          showMessage('', false); // hộp OTP đã tự giải thích, không cần dòng đỏ
        } else {
          showMessage(err.message, true);
        }
      } finally {
        button.disabled = false;
      }
    });
  });

  // nút gửi OTP SMS
  const sendOtp = document.getElementById('send-otp');
  if (sendOtp) {
    sendOtp.addEventListener('click', async () => {
      try {
        const body = await postJson('/api/transactions/otp', {});
        const hint = body.data && body.data.devOtp
          ? ` (Môi trường thử) Mã OTP: ${body.data.devOtp}`
          : '';
        showMessage(body.message + hint, false);
      } catch (err) {
        showMessage(err.message, true);
      }
    });
  }
})();