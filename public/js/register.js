(function () {
  const wizard = document.getElementById('register-wizard');
  if (!wizard) return;

  const steps = wizard.querySelectorAll('.step');
  const existsBox = document.getElementById('email-exists');
  const data = {}; // mật khẩu, họ tên giữ tạm trong trang
  let phone = '';

  function goTo(n) {
    steps.forEach((s) => {
      s.hidden = Number(s.dataset.step) !== n;
    });
    existsBox.hidden = true;
    showMessage('', false);
  }

  // gắn xử lý submit cho form của từng bước
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

  // chỉ có devOtp khi kênh đang giả lập (chưa có SMS thật)
  function hint(body, text) {
    if (body.data && body.data.devOtp) {
      showMessage(`${text} (môi trường thử) Mã OTP: ${body.data.devOtp}`, false);
    } else {
      showMessage(text, false);
    }
  }

  // 1 email
  bind(1, async (f) => {
    existsBox.hidden = true;
    let body;
    try {
      body = await postJson('/api/register/email', f);
    } catch (err) {
      if (err.details && err.details.code === 'EMAIL_EXISTS') {
        existsBox.hidden = false;
        return;
      }
      throw err;
    }
    goTo(2);
    hint(body, body.message);
  });

  document.querySelector('#form-1 input[name="email"]').addEventListener('input', () => {
    existsBox.hidden = true;
  });

  // 2 mã email
  bind(2, async (f) => {
    await postJson('/api/register/verify-email', f);
    goTo(3);
  });

  // 3 số điện thoại
  bind(3, async (f) => {
    const body = await postJson('/api/register/phone', f);
    phone = f.phone;
    goTo(4);
    hint(body, body.message);
  });

  // 4 mã SMS
  bind(4, async (f) => {
    await postJson('/api/register/verify-phone', f);
    goTo(5);
  });

  document.getElementById('resend-phone').addEventListener('click', async () => {
    try {
      const body = await postJson('/api/register/phone', { phone });
      hint(body, 'Đã gửi lại mã');
    } catch (err) {
      showMessage(err.message, true);
    }
  });

  // 5-7 giữ trong trang, gửi một lần ở cuối
  bind(5, async (f) => {
    if (f.password !== f.confirm) throw new Error('Mật khẩu nhập lại không khớp');
    data.password = f.password;
    goTo(6);
  });

  bind(6, async (f) => {
    data.fullName = f.fullName;
    goTo(7);
  });

  bind(7, async (f) => {
    const body = await postJson('/api/register/complete', {
      password: data.password,
      fullName: data.fullName,
      dateOfBirth: f.dateOfBirth,
      address: f.address,
    });
    showMessage(body.message + '. Đang chuyển sang đăng nhập...', false);
    setTimeout(() => (window.location.href = '/login'), 1000);
  });

  goTo(1);
})();