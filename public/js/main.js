// gửi JSON tới server, lỗi thì ném err kèm status và details (để biết mã lỗi).
async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data || {}),
  });
  const body = await res.json();

  if (!res.ok) {
    const err = new Error(body.message || 'Có lỗi xảy ra');
    err.status = res.status;
    err.details = body.details;
    throw err;
  }
  return body;
}

async function putJson(url, data) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data || {}),
  });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(body.message || 'Có lỗi xảy ra');
    err.status = res.status;
    err.details = body.details;
    throw err;
  }
  return body;
}

function showMessage(text, isError) {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = text; // textContent: không chạy HTML, an toàn trước XSS
  el.className = 'message ' + (isError ? 'message--error' : 'message--success');
}

// đăng nhập
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    try {
      await postJson('/api/auth/login', data);
      window.location.href = '/dashboard';
    } catch (err) {
      showMessage(err.message, true);
    }
  });
}

// đăng xuất
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await postJson('/api/auth/logout');
    window.location.href = '/login';
  });
}