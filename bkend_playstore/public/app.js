const tbody = document.getElementById('list');
const statusEl = document.getElementById('status');

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function button(label, className, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}

function cell(text) {
  const element = document.createElement('td');
  element.textContent = text ?? '';
  return element;
}

async function adminFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Sessao expirada');
  }

  return response;
}

async function load() {
  setStatus('Carregando dispositivos...');
  const response = await adminFetch('/admin/devices');
  const data = await response.json();

  tbody.replaceChildren();

  data.forEach((device) => {
    const tr = document.createElement('tr');
    tr.append(
      cell(device.android_id),
      cell(device.plan),
      cell(String(device.daily_count ?? 0))
    );

    const actions = document.createElement('td');
    actions.className = 'actions';
    actions.append(
      button('PRO', 'btn-primary', () => setPlan(device.android_id, 'PRO')),
      button('FREE', 'btn-primary', () => setPlan(device.android_id, 'FREE')),
      button('DEL', 'btn-danger', () => del(device.android_id))
    );
    tr.append(actions);
    tbody.append(tr);
  });

  setStatus(`${data.length} dispositivo(s) encontrado(s).`);
}

async function setPlan(id, plan) {
  await adminFetch('/admin/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ android_id: id, plan })
  });
  load();
}

async function del(id) {
  if (!confirm(`Remover o dispositivo ${id}?`)) return;

  await adminFetch(`/admin/device/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  load();
}

async function logout() {
  await adminFetch('/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login';
}

load().catch((error) => {
  setStatus(error.message || 'Erro ao carregar dispositivos.');
});
