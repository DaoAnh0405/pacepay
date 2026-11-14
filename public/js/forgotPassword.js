(function () {
  const wizard = document.getElementById('forgot-wizard');
  if (!wizard) return;

  const steps = wizard.querySelectorAll('.step');
  const missingBox = document.getElementById('account-missing');

  function goTo(n) {
    missingBox.hidden = true;
    steps.forEach((s) => {
      s.hidden = Number(s.dataset.step) !== n;
    });
  }

  function bind(n, handler) {
    document.getElementById(`form-${n}`).addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(e.target));
      try {
        await handler(fields);
      } catch (err) {
        showMessage(err.message, true);
      }
    });
  }

  // chỉ có devOtp khi kênh đang giả lập
  function hint(body) {
    const extra = body.data && body.data.devOtp
      ? ` (Môi trường thử) Mã OTP: ${body.data.devOtp}`
      : '';
    showMessage(body.message + extra, false);
  }

    bind(1, async (f) => {
    missingBox.hidden = true;
    let body;
    try {
      body = await postJson('/api/password/forgot', f);
    } catch (err) {
      if (err.details && err.details.code === 'ACCOUNT_NOT_FOUND') {
        missingBox.hidden = false; // hiện "tài khoản không tồn tại" + nút Đăng ký
        return;
      }
      throw err; // lỗi khác hiện như bình thường
    }
    goTo(2);
    hint(body);
  });

  document.querySelector('#form-1 input[name="email"]').addEventListener('input', () => {
    missingBox.hidden = true;
  });

  bind(2, async (f) => {
    const body = await postJson('/api/password/verify-email', f);
    goTo(3);
    hint(body);
  });

  bind(3, async (f) => {
    await postJson('/api/password/verify-phone', f);
    goTo(4);
    showMessage('', false);
  });

  bind(4, async (f) => {
    if (f.password !== f.confirm) throw new Error('Mật khẩu nhập lại không khớp');
    const body = await postJson('/api/password/reset', { password: f.password });
    showMessage(body.message + '. Đang chuyển sang đăng nhập...', false);
    setTimeout(() => (window.location.href = '/login'), 1200);
  });

  goTo(1);
})();