(function () {
  const wizard = document.getElementById('forgot-wizard');
  if (!wizard) return;

  const TOTAL = 4;
  const steps = wizard.querySelectorAll('.step');

  function goTo(n) {
    steps.forEach((s) => {
      s.hidden = Number(s.dataset.step) !== n;
    });
    document.getElementById('progress').textContent = `Bước ${n}/${TOTAL}`;
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
    const body = await postJson('/api/password/forgot', f);
    goTo(2);
    hint(body);
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