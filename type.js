(async () => {
  // --- 1. Жмём на бургер ---
  function openBurger() {
    const ripple = document.querySelector('.ripple-container');
    let burgerBtn = ripple;
    for (let i = 0; i < 4 && burgerBtn; ++i) {
      if (burgerBtn.onclick || burgerBtn.tagName === "BUTTON" || burgerBtn.getAttribute('role') === 'button') break;
      burgerBtn = burgerBtn.parentElement;
    }
    if (burgerBtn) {
      burgerBtn.click();
      return true;
    }
    alert("Не найдено бургер-меню!");
    return false;
  }
  openBurger();

  // --- 2. Ждём и кликаем "Contacts" ---
  async function waitAndClickContacts() {
    for (let i = 0; i < 25; ++i) {
      const contactsBtn = Array.from(document.querySelectorAll('div[role="menuitem"].MenuItem.compact'))
        .find(el => el.textContent.trim().toLowerCase().includes('contacts') && el.querySelector('.icon-user'));
      if (contactsBtn) {
        contactsBtn.click();
        return true;
      }
      await new Promise(r => setTimeout(r, 120));
    }
    alert("Не найдена кнопка 'Contacts'.");
    return false;
  }
  await waitAndClickContacts();

  // --- 3. Ждём, пока контакты появятся ---
  async function waitForContactsList() {
    for (let i = 0; i < 50; ++i) {
      const items = document.querySelectorAll('.chat-list .contact-list-item');
      if (items.length > 0) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }
  const ok = await waitForContactsList();
  if (!ok) {
    alert('Контакты не найдены! Открой их вручную и повтори скрипт.');
    return;
  }

  // --- 4. Собираем контакты ---
  const contactDivs = Array.from(document.querySelectorAll('.chat-list .contact-list-item'));
  const contacts = contactDivs.map(item => {
    const button = item.querySelector('.ListItem-button[role="button"]');
    const nameEl = item.querySelector('.fullName');
    const name = nameEl ? nameEl.textContent.trim() : '(Без имени)';
    return button && name ? { name, element: button } : null;
  }).filter(Boolean);

  if (!contacts.length) {
    alert('Список контактов пуст!');
    return;
  }

  // --- 5. Интерфейс рассылки ---
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#fff', padding: '20px', borderRadius: '10px', width: '370px', maxHeight: '80vh', overflowY: 'auto',
    boxShadow: '0 4px 24px #0002', fontFamily: 'sans-serif', color: '#222'
  });

  const title = document.createElement('h3');
  title.innerText = 'Выберите контакты:';
  panel.appendChild(title);

  // --- Кнопки массовых действий ---
  const groupBtns = document.createElement('div');
  groupBtns.style.marginBottom = '8px';
  groupBtns.style.display = 'flex';
  groupBtns.style.gap = '8px';
  panel.appendChild(groupBtns);

  const btnAll = document.createElement('button');
  btnAll.textContent = 'Выбрать все';
  btnAll.type = 'button';
  btnAll.style.flex = '1';
  const btnNone = document.createElement('button');
  btnNone.textContent = 'Снять все';
  btnNone.type = 'button';
  btnNone.style.flex = '1';
  const btnInvert = document.createElement('button');
  btnInvert.textContent = 'Инвертировать';
  btnInvert.type = 'button';
  btnInvert.style.flex = '1';

  [btnAll, btnNone, btnInvert].forEach(b => {
    Object.assign(b.style, {
      padding: '6px', border: '1px solid #bbb', borderRadius: '5px',
      background: '#f3f3f3', color: '#333', cursor: 'pointer'
    });
    groupBtns.appendChild(b);
  });

  // --- Список чекбоксов ---
  const list = document.createElement('div');
  list.style.maxHeight = '250px';
  list.style.overflowY = 'auto';
  list.style.marginBottom = '10px';

  contacts.forEach((c, i) => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '3px';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = i;
    cb.checked = true;
    label.appendChild(cb);
    label.append(' ' + c.name);
    list.appendChild(label);
  });
  panel.appendChild(list);

  btnAll.onclick = () => list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true);
  btnNone.onclick = () => list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  btnInvert.onclick = () => list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = !cb.checked);

  // --- Поле для сообщения и кнопки ---
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Введите сообщение...';
  textarea.style.width = '100%';
  textarea.style.height = '60px';
  textarea.style.marginBottom = '10px';
  textarea.style.resize = 'vertical';
  panel.appendChild(textarea);

  const sendBtn = document.createElement('button');
  sendBtn.textContent = '📤 Отправить';
  sendBtn.style.margin = '5px 10px 0 0';
  sendBtn.style.padding = '8px 16px';
  sendBtn.style.borderRadius = '6px';
  sendBtn.style.background = '#48a1ec';
  sendBtn.style.color = '#fff';
  sendBtn.style.fontWeight = 'bold';
  sendBtn.style.border = 'none';
  sendBtn.style.cursor = 'pointer';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '❌ Закрыть';
  closeBtn.style.margin = '5px 0 0 0';
  closeBtn.style.padding = '8px 12px';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.background = '#eee';
  closeBtn.style.color = '#333';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';

  panel.appendChild(sendBtn);
  panel.appendChild(closeBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  closeBtn.onclick = () => overlay.remove();

  // --- Массовая отправка ---
  sendBtn.onclick = async () => {
    const msg = textarea.value.trim();
    if (!msg) return alert('Введите сообщение!');
    const selected = Array.from(list.querySelectorAll('input[type=checkbox]:checked')).map(cb => contacts[cb.value]);
    if (!selected.length) return alert('Выберите хотя бы один контакт!');
    if (!confirm(`Отправить сообщение в ${selected.length} контактов?`)) return;

    sendBtn.disabled = true;
    closeBtn.disabled = true;
    btnAll.disabled = btnNone.disabled = btnInvert.disabled = true;

    for (let i = 0; i < selected.length; ++i) {
      const contact = selected[i];
      contact.element.click();
      await new Promise(r => setTimeout(r, 650));
      const input = document.querySelector('[contenteditable="true"]');
      const send = document.querySelector('button.Button.send[aria-label="Send Message"]');
      if (input && send) {
        input.focus();
        input.innerHTML = msg.replace(/\n/g, '<br>');
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));
        send.click();
        await new Promise(r => setTimeout(r, 700));
      } else {
        console.warn('Не найдено поле ввода или кнопка отправки для', contact.name);
      }
    }
    alert('Сообщения отправлены!');
    overlay.remove();
  };
})();
