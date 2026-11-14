(function () {
  const form = document.getElementById('password-form');
  if (!form) return;

  document.getElementById('password-send-otp').addEventListener('click', async () => {
    const hint = document.getElementById('otp-hint');
    try {
      const body = await postJson('/api/account/password/otp', {});
      const dev = body.data && body.data.devOtp
        ? ` (Môi trường thử) Mã OTP: ${body.data.devOtp}`
        : '';
      hint.textContent = body.message + dev;
    } catch (err) {
      hint.textContent = err.message;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (f.newPassword !== f.confirm) {
      showMessage('Mật khẩu nhập lại không khớp', true);
      return;
    }
    try {
      const body = await postJson('/api/account/password', {
        otp: f.otp,
        currentPassword: f.currentPassword,
        newPassword: f.newPassword,
      });
      showMessage(body.message + '. Đang quay lại trang tài khoản...', false);
      setTimeout(() => (window.location.href = '/profile'), 1200);
    } catch (err) {
      showMessage(err.message, true);
    }
  });
})();