async function load() {
  const res = await fetch('/admin/devices');
  const data = await res.json();

  const tbody = document.getElementById('list');
  tbody.innerHTML = '';

  data.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.android_id}</td>
        <td>${d.plan}</td>
        <td>${d.daily_count}</td>
        <td>
          <button onclick="setPlan('${d.android_id}', 'PRO')">PRO</button>
          <button onclick="setPlan('${d.android_id}', 'FREE')">FREE</button>
          <button onclick="del('${d.android_id}')">DEL</button>
        </td>
      </tr>
    `;
  });
}

async function setPlan(id, plan) {
  await fetch('/admin/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ android_id: id, plan })
  });
  load();
}

async function del(id) {
  await fetch('/admin/device/' + id, { method: 'DELETE' });
  load();
}

load();
