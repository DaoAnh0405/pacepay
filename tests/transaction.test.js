const svc = require('../src/services/transactionService');
const { resetData, createUser, balanceOf, newKey, db } = require('./helpers');

let a;
let b;

beforeEach(async () => {
  await resetData();
  a = await createUser({ email: 'a@test.com', balance: 100000 });
  b = await createUser({ email: 'b@test.com', balance: 0 });
});

afterAll(async () => {
  await db.pool.end();
});

describe('Nạp tiền', () => {
  test('nạp thành công, số dư tăng', async () => {
    await svc.deposit(a.id, { amount: 50000, idempotencyKey: newKey() });
    expect(await balanceOf(a.id)).toBe(150000);
  });

  test('từ chối số tiền dưới hạn mức', async () => {
    await expect(svc.deposit(a.id, { amount: 5000, idempotencyKey: newKey() }))
      .rejects.toThrow('tối thiểu');
  });

  test('từ chối số tiền lẻ', async () => {
    await expect(svc.deposit(a.id, { amount: 10000.5, idempotencyKey: newKey() }))
      .rejects.toThrow('số nguyên');
  });
});

describe('Rút tiền', () => {
  test('rút đúng PIN, số dư giảm', async () => {
    await svc.withdraw(a.id, { amount: 30000, pin: a.pin, idempotencyKey: newKey() });
    expect(await balanceOf(a.id)).toBe(70000);
  });

  test('sai PIN thì không trừ tiền', async () => {
    await expect(svc.withdraw(a.id, { amount: 30000, pin: '000000', idempotencyKey: newKey() }))
      .rejects.toThrow('PIN không đúng');
    expect(await balanceOf(a.id)).toBe(100000);
  });

  test('không đủ số dư', async () => {
    await expect(svc.withdraw(a.id, { amount: 200000, pin: a.pin, idempotencyKey: newKey() }))
      .rejects.toThrow('Số dư không đủ');
    expect(await balanceOf(a.id)).toBe(100000);
  });

  test('sai PIN 5 lần thì bị khóa, PIN đúng cũng bị từ chối', async () => {
    for (let i = 0; i < 5; i++) {
      await svc.withdraw(a.id, { amount: 20000, pin: '000000', idempotencyKey: newKey() })
        .catch(() => {});
    }
    await expect(svc.withdraw(a.id, { amount: 20000, pin: a.pin, idempotencyKey: newKey() }))
      .rejects.toThrow('khóa');
  });

  test('giao dịch từ 5 triệu không có OTP thì bị yêu cầu OTP', async () => {
    await db.query('UPDATE wallets SET balance = 10000000 WHERE user_id = $1', [a.id]);
    await expect(svc.withdraw(a.id, { amount: 6000000, pin: a.pin, idempotencyKey: newKey() }))
      .rejects.toThrow('mã xác nhận SMS');
  });
});

describe('Chuyển tiền', () => {
  test('chuyển thành công: người gửi giảm, người nhận tăng, tổng tiền không đổi', async () => {
    await svc.transfer(a.id, {
      email: b.email, amount: 40000, pin: a.pin, idempotencyKey: newKey(),
    });
    expect(await balanceOf(a.id)).toBe(60000);
    expect(await balanceOf(b.id)).toBe(40000);
  });

  test('không chuyển cho chính mình', async () => {
    await expect(svc.transfer(a.id, {
      email: a.email, amount: 20000, pin: a.pin, idempotencyKey: newKey(),
    })).rejects.toThrow('chính mình');
  });

  test('người nhận không tồn tại', async () => {
    await expect(svc.transfer(a.id, {
      email: 'khong-co@test.com', amount: 20000, pin: a.pin, idempotencyKey: newKey(),
    })).rejects.toThrow('Không tìm thấy người nhận');
  });

  test('không đủ số dư thì cả hai ví đều không đổi', async () => {
    await expect(svc.transfer(a.id, {
      email: b.email, amount: 500000, pin: a.pin, idempotencyKey: newKey(),
    })).rejects.toThrow('Số dư không đủ');
    expect(await balanceOf(a.id)).toBe(100000);
    expect(await balanceOf(b.id)).toBe(0);
  });
});

describe('Idempotency: gửi trùng không bị trừ hai lần', () => {
  test('cùng key tuần tự: lần hai trả kết quả cũ', async () => {
    const key = newKey();
    const r1 = await svc.withdraw(a.id, { amount: 20000, pin: a.pin, idempotencyKey: key });
    const r2 = await svc.withdraw(a.id, { amount: 20000, pin: a.pin, idempotencyKey: key });
    expect(r1.replayed).toBe(false);
    expect(r2.replayed).toBe(true);
    expect(await balanceOf(a.id)).toBe(80000);
  });

  test('5 request cùng key đồng thời: chỉ trừ đúng 1 lần', async () => {
    const key = newKey();
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        svc.withdraw(a.id, { amount: 20000, pin: a.pin, idempotencyKey: key })),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(await balanceOf(a.id)).toBe(80000);
  });
});

describe('Race condition: chạy đồng thời không làm âm tiền', () => {
  test('5 lệnh rút 30.000 cùng lúc khi chỉ có 100.000: tối đa 3 lệnh thành công', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        svc.withdraw(a.id, { amount: 30000, pin: a.pin, idempotencyKey: newKey() })),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    expect(ok).toBe(3);
    expect(await balanceOf(a.id)).toBe(10000); // 100000 - 3 x 30000
  });

  test('A chuyển B và B chuyển A cùng lúc: không deadlock, tổng tiền giữ nguyên', async () => {
    await db.query('UPDATE wallets SET balance = 100000 WHERE user_id = $1', [b.id]);
    const jobs = [];
    for (let i = 0; i < 5; i++) {
      jobs.push(svc.transfer(a.id, {
        email: b.email, amount: 10000, pin: a.pin, idempotencyKey: newKey(),
      }));
      jobs.push(svc.transfer(b.id, {
        email: a.email, amount: 10000, pin: b.pin, idempotencyKey: newKey(),
      }));
    }
    await Promise.all(jobs);
    const total = (await balanceOf(a.id)) + (await balanceOf(b.id));
    expect(total).toBe(200000);
  });
});

describe('Sổ cái bất biến', () => {
  test('không sửa được giao dịch đã ghi', async () => {
    await svc.deposit(a.id, { amount: 20000, idempotencyKey: newKey() });
    await expect(db.query('UPDATE transactions SET amount = 1')).rejects.toThrow('chỉ được thêm');
  });
});