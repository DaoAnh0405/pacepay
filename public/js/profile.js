(function () {
  const root = document.getElementById('prof');
  if (!root) return;

  // dữ liệu hiện tại. PUT /profile ghi đè cả 3 trường, nên luôn gửi đủ
  const cur = {
    fullName: root.dataset.name,
    dateOfBirth: root.dataset.dob,
    address: root.dataset.address,
  };

  function say(id, text, isError) {
    const el = document.getElementById(id);
    el.textContent = text; // textContent: không chạy HTML lạ
    el.className = 'message ' + (isError ? 'message--error' : 'message--success');
  }

  // nút mở modal và nút đóng modal
  document.querySelectorAll('[data-open]').forEach((b) => {
    b.addEventListener('click', () => document.getElementById(b.dataset.open).showModal());
  });
  document.querySelectorAll('[data-close]').forEach((b) => {
    b.addEventListener('click', () => b.closest('dialog').close());
  });

  // đổi tên / đổi địa chỉ: gửi PUT rồi tải lại trang
  function bindProfileForm(formId, msgId, build) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const next = build(Object.fromEntries(new FormData(form)));
        const body = await putJson('/api/account/profile', next);
        say(msgId, body.message, false);
        setTimeout(() => window.location.reload(), 500);
      } catch (err) {
        say(msgId, err.message, true);
      }
    });
  }
  bindProfileForm('form-name', 'msg-name', (f) => ({ ...cur, fullName: f.fullName }));
  bindProfileForm('form-address', 'msg-address', (f) => ({ ...cur, address: f.address }));

  // PIN mở modal là gửi SMS ngay
  const pinDialog = document.getElementById('dlg-pin');
  const pinForm = document.getElementById('form-pin');
  const pinHint = document.getElementById('pin-hint');

  async function sendPinOtp() {
    try {
      const body = await postJson('/api/account/pin/otp', {});
      const dev = body.data && body.data.devOtp
        ? ` (Môi trường thử) Mã OTP: ${body.data.devOtp}`
        : '';
      pinHint.textContent = body.message + dev;
    } catch (err) {
      // ví dụ "vui lòng chờ N giây": mã đã gửi trước đó vẫn dùng được
      pinHint.textContent = err.message;
    }
  }

  document.getElementById('pin-open').addEventListener('click', () => {
    pinForm.reset();
    say('msg-pin', '', false);
    pinHint.textContent = 'Đang gửi mã SMS tới số điện thoại của bạn...';
    pinDialog.showModal();
    sendPinOtp();
  });
  document.getElementById('pin-resend').addEventListener('click', sendPinOtp);

  pinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(pinForm));
    if (f.pin !== f.confirm) {
      say('msg-pin', 'PIN nhập lại không khớp', true);
      return;
    }
    try {
      const body = await postJson('/api/account/pin', { otp: f.otp, pin: f.pin });
      say('msg-pin', body.message, false);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      say('msg-pin', err.message, true);
    }
  });
})();