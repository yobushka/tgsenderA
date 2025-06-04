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

  // --- 4. Скроллим контейнер контактов для подгрузки всех контактов ---
  const contactsContainer = document.querySelector('.chat-list');
  if (contactsContainer) {
    let lastCount = 0;
    let stableTries = 0;
    for (let i = 0; i < 50 && stableTries < 5; ++i) {
      contactsContainer.scrollTop = contactsContainer.scrollHeight;
      await new Promise(r => setTimeout(r, 200));
      const items = contactsContainer.querySelectorAll('.contact-list-item');
      if (items.length === lastCount) {
        stableTries++;
      } else {
        stableTries = 0;
        lastCount = items.length;
      }
    }
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

  // --- Фильтр по имени ---
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.placeholder = 'Фильтр по имени...';
  filterInput.style.width = '100%';
  filterInput.style.marginBottom = '8px';
  filterInput.style.padding = '6px';
  filterInput.style.border = '1px solid #bbb';
  filterInput.style.borderRadius = '5px';
  panel.appendChild(filterInput);

  // --- Список чекбоксов ---
  const list = document.createElement('div');
  list.style.maxHeight = '250px';
  list.style.overflowY = 'auto';
  list.style.marginBottom = '10px';
  list.style.whiteSpace = 'pre-line'; // Добавлено для поддержки переносов строк

  function renderContactList() {
    list.innerHTML = '';
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
  }
  renderContactList();

  panel.appendChild(list);

  // Функция фильтрации
  filterInput.addEventListener('input', () => {
    const val = filterInput.value.trim().toLowerCase();
    const labels = list.querySelectorAll('label');
    contacts.forEach((c, i) => {
      const label = labels[i];
      if (!val || c.name.toLowerCase().includes(val)) {
        label.style.display = '';
      } else {
        label.style.display = 'none';
      }
    });
    // Добавляем перенос строки после каждого видимого контакта
    Array.from(labels).forEach(label => {
      if (label.style.display !== 'none') {
        label.style.marginBottom = '8px';
      }
    });
  });

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
    console.log('Starting bulk message sending...');

    // Скрываем overlay во время отправки, чтобы он не блокировал клики
    overlay.style.display = 'none';
    console.log('Overlay hidden to prevent click blocking');

    for (let i = 0; i < selected.length; ++i) {
      const contact = selected[i];
      console.log(`Processing contact ${i + 1}/${selected.length}: ${contact.name}`);
      // Закроем предыдущий чат, чтобы точно переключиться
      if (i > 0) {
        console.log('Closing previous chat before switching...');
        
        // Улучшенная стратегия возврата к списку контактов
        let backSuccess = false;
        
        // Способ 1: Расширенный поиск кнопки "Назад"
        const backSelectors = [
          '.back-button',
          '.BackButton', 
          '[aria-label="Back"]',
          '[aria-label="Go back"]',
          '.header-back-button',
          '.btn-back',
          '.middle-column-header .back-button',
          '.chat-header .back-button',
          'button.back',
          '[data-testid="back-button"]'
        ];
        
        for (const selector of backSelectors) {
          const backButton = document.querySelector(selector);
          if (backButton && backButton.offsetParent !== null) { // Проверяем видимость
            console.log('Found back button with selector:', selector, backButton);
            
            // Убеждаемся что кнопка кликабельна
            backButton.focus();
            backButton.click();
            
            // Дополнительные методы клика для надежности
            backButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            
            await new Promise(r => setTimeout(r, 1200));
            
            // Проверяем, что вернулись к списку контактов
            const contactsList = document.querySelector('.chat-list .contact-list-item');
            if (contactsList) {
              console.log('Successfully returned to contacts list');
              backSuccess = true;
              break;
            }
          }
        }
        
        // Способ 2: Если кнопка "Назад" не найдена или не сработала, используем Escape
        if (!backSuccess) {
          console.log('Back button method failed, trying Escape key approach...');
          
          // Фокусируемся на document и отправляем Escape
          document.body.focus();
          
          for (let escAttempt = 0; escAttempt < 5; escAttempt++) {
            console.log(`Escape attempt ${escAttempt + 1}/5`);
            
            // Отправляем Escape для активного элемента и документа
            const activeEl = document.activeElement || document.body;
            
            [activeEl, document, window].forEach(target => {
              if (target.dispatchEvent) {
                target.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Escape',
                  code: 'Escape',
                  keyCode: 27,
                  which: 27,
                  bubbles: true,
                  cancelable: true
                }));
                
                target.dispatchEvent(new KeyboardEvent('keyup', {
                  key: 'Escape',
                  code: 'Escape',
                  keyCode: 27,
                  which: 27,
                  bubbles: true,
                  cancelable: true
                }));
              }
            });
            
            await new Promise(r => setTimeout(r, 500));
            
            // Проверяем результат
            const contactsList = document.querySelector('.chat-list .contact-list-item');
            if (contactsList) {
              console.log('Escape key successfully returned to contacts list');
              backSuccess = true;
              break;
            }
          }
        }
        
        // Способ 3: Принудительное возвращение через бургер-меню
        if (!backSuccess) {
          console.log('Escape failed, forcing return via hamburger menu...');
          
          // Закрываем все модальные окна и диалоги
          const modals = document.querySelectorAll('.modal, .dialog, .popup');
          modals.forEach(modal => {
            if (modal.style.display !== 'none' && modal.offsetParent !== null) {
              modal.style.display = 'none';
            }
          });
          
          await new Promise(r => setTimeout(r, 300));
          
          // Открываем бургер-меню заново
          const burger = document.querySelector('.ripple-container');
          if (burger) {
            let burgerBtn = burger;
            for (let j = 0; j < 4 && burgerBtn; ++j) {
              if (burgerBtn.onclick || burgerBtn.tagName === "BUTTON" || burgerBtn.getAttribute('role') === 'button') break;
              burgerBtn = burgerBtn.parentElement;
            }
            
            if (burgerBtn) {
              console.log('Clicking hamburger menu button');
              burgerBtn.click();
              await new Promise(r => setTimeout(r, 700));
              
              // Ищем и кликаем "Contacts" снова
              const contactsBtn = Array.from(document.querySelectorAll('div[role="menuitem"].MenuItem.compact'))
                .find(el => el.textContent.trim().toLowerCase().includes('contacts') && el.querySelector('.icon-user'));
              
              if (contactsBtn) {
                console.log('Clicking Contacts menu item');
                contactsBtn.click();
                await new Promise(r => setTimeout(r, 1200));
                
                // Финальная проверка
                const contactsList = document.querySelector('.chat-list .contact-list-item');
                if (contactsList) {
                  console.log('Successfully re-opened contacts via hamburger menu');
                  backSuccess = true;
                }
              }
            }
          }
        }
        
        // Способ 4: Последняя попытка - прямая навигация по URL (если доступна)
        if (!backSuccess) {
          console.log('All methods failed, trying URL navigation...');
          
          try {
            // Пробуем изменить hash для возврата к контактам
            if (window.location.hash.includes('#')) {
              const oldHash = window.location.hash;
              window.location.hash = '#contacts';
              await new Promise(r => setTimeout(r, 500));
              
              // Если не помогло, возвращаем старый hash
              const contactsList = document.querySelector('.chat-list .contact-list-item');
              if (!contactsList) {
                window.location.hash = oldHash;
              } else {
                backSuccess = true;
              }
            }
          } catch (e) {
            console.warn('URL navigation failed:', e);
          }
        }
        
        if (!backSuccess) {
          console.warn('All back navigation methods failed! Contact switching may not work properly.');
          // Продолжаем выполнение, но предупреждаем пользователя
        } else {
          console.log('Successfully returned to contacts list');
        }
        
        // Дополнительное время для стабилизации интерфейса
        await new Promise(r => setTimeout(r, 1500));
      }
      
      // Получаем информацию о контакте для отладки
      console.log('Contact element details:', {
        tagName: contact.element.tagName,
        className: contact.element.className,
        innerHTML: contact.element.innerHTML.substring(0, 200) + '...',
        offsetParent: contact.element.offsetParent,
        style: contact.element.style.cssText
      });
      
      // Прокручиваем к контакту, чтобы убедиться, что он видим
      contact.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(r => setTimeout(r, 300));
      // Дополнительно: скроллим контакт вне экрана и обратно для надёжности
      try {
        contactsContainer.scrollTop = 0;
        await new Promise(r => setTimeout(r, 150));
        contact.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(r => setTimeout(r, 200));
      } catch (e) { console.warn('Scroll hack failed', e); }

      // Получаем координаты центра контакта
      const rect = contact.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Получаем реальный элемент под курсором (на случай виртуализации)
      let clickable = document.elementFromPoint(centerX, centerY);
      if (!clickable || !clickable.closest('.ListItem, .ListItem-button, .contact-list-item')) {
        clickable = contact.element;
      }
      // Пробуем разные методы переключения на контакт
      let switchSuccess = false;
      // Новый блок: всегда сбрасываем список контактов через бургер-меню и "Contacts"
      try {
        // Открываем бургер-меню
        const burger = document.querySelector('.ripple-container');
        if (burger) {
          let burgerBtn = burger;
          for (let j = 0; j < 4 && burgerBtn; ++j) {
            if (burgerBtn.onclick || burgerBtn.tagName === "BUTTON" || burgerBtn.getAttribute('role') === 'button') break;
            burgerBtn = burgerBtn.parentElement;
          }
          if (burgerBtn) {
            burgerBtn.click();
            await new Promise(r => setTimeout(r, 700));
            // Кликаем "Contacts"
            const contactsBtn = Array.from(document.querySelectorAll('div[role="menuitem"].MenuItem.compact'))
              .find(el => el.textContent.trim().toLowerCase().includes('contacts') && el.querySelector('.icon-user'));
            if (contactsBtn) {
              contactsBtn.click();
              await new Promise(r => setTimeout(r, 1200));
            }
          }
        }
      } catch (e) { console.warn('Burger/Contacts reset failed', e); }

      // Метод 1: простой клик
      try {
        contact.element.click();
      } catch (e) {
        console.warn('Error in simple click method:', e);
      }
      
      // Метод 2: клик с coordinates
      await new Promise(r => setTimeout(r, 200));
      try {
        const rect = contact.element.getBoundingClientRect();
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        });
        contact.element.dispatchEvent(clickEvent);
      } catch (e) {
        console.warn('Error in click with coordinates method:', e);
      }
      
      // Метод 3: поиск и клик по родительскому элементу
      await new Promise(r => setTimeout(r, 200));
      try {
        const parentClickable = contact.element.closest('.chat-item-clickable, .ListItem');
        if (parentClickable && parentClickable !== contact.element) {
          parentClickable.click();
        }
      } catch (e) {
        console.warn('Error in parent click method:', e);
      }
      
      // Метод 4: стимулируем реальный клик через события mousedown/mouseup
      await new Promise(r => setTimeout(r, 200));
      try {
        contact.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        contact.element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        contact.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      } catch (e) {
        console.warn('Error in real click stimulation method:', e);
      }
      
      // Проверяем правильное переключение контакта с несколькими попытками
      let maxSwitchAttempts = 8;
      let currentChatName = null;
      for (let attempt = 0; attempt < maxSwitchAttempts; attempt++) {
        await new Promise(r => setTimeout(r, 1200));
        console.log(`Contact switch verification attempt ${attempt + 1}/${maxSwitchAttempts}`);
        // Новый: ищем имя активного чата только в основном контейнере чата
        const chatHeaderEl = document.querySelector('.chat-info-wrapper .ChatInfo .info .fullName, .chat-info-wrapper .ChatInfo .info .title h3');
        currentChatName = chatHeaderEl && chatHeaderEl.textContent.trim();
        if (currentChatName) {
          console.log(`Found chat name using .chat-info-wrapper:`, currentChatName);
        } else {
          // Fallback: старые селекторы, если основной не сработал
          const chatSelectors = [
            '.ChatInfo .title h3',
            '.ChatInfo h3',
            '.chat-info .title',
            '.middle-column-header .chat-title',
            '[data-testid="chat-title"]',
            '.chat-header .title',
            '.header-title',
            '.conversation-title',
            '.chat-name',
            '.peer-title'
          ];
          for (const selector of chatSelectors) {
            const chatHeader = document.querySelector(selector);
            if (chatHeader && chatHeader.textContent.trim()) {
              currentChatName = chatHeader.textContent.trim();
              console.log(`Fallback chat name using selector "${selector}":`, currentChatName);
              break;
            }
          }
        }
        
        // Дополнительная проверка через URL или другие признаки
        if (!currentChatName) {
          console.log('Chat name not found via selectors, trying alternative methods...');
          
          // Проверяем URL hash
          if (window.location.hash) {
            const hashMatch = window.location.hash.match(/#\/im\?p=@([^&]+)/);
            if (hashMatch) {
              currentChatName = decodeURIComponent(hashMatch[1]);
              console.log('Found chat name from URL hash:', currentChatName);
            }
          }
          
          // Проверяем через document.title
          if (!currentChatName && document.title && document.title !== 'Telegram') {
            const titleParts = document.title.split(' – ');
            if (titleParts.length > 1) {
              currentChatName = titleParts[0];
              console.log('Found chat name from document title:', currentChatName);
            }
          }
        }
        
        console.log(`Verification attempt ${attempt+1}: Expected "${contact.name}", Found "${currentChatName}"`);
        
        // Проверяем соответствие имени (с учетом возможных вариций)
        if (currentChatName) {
          const nameMatches = [
            currentChatName === contact.name,
            currentChatName.includes(contact.name),
            contact.name.includes(currentChatName),
            currentChatName.toLowerCase() === contact.name.toLowerCase(),
            currentChatName.toLowerCase().includes(contact.name.toLowerCase()),
            contact.name.toLowerCase().includes(currentChatName.toLowerCase())
          ];
          if (nameMatches.some(Boolean)) {
            switchSuccess = true;
            break;
          }
        }
        // Если переключение не удалось, пробуем поиск через строку поиска Telegram Web
        if (attempt === 3 && !switchSuccess) {
          console.log('Trying to switch chat via search bar...');
          // Ищем строку поиска
          let searchInput = document.querySelector('input[type="search"], input[placeholder*="earch"], .search-input input');
          if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 200));
            // Вводим имя контакта
            for (let i = 0; i < contact.name.length; i++) {
              searchInput.value += contact.name[i];
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              await new Promise(r => setTimeout(r, 30));
            }
            await new Promise(r => setTimeout(r, 700));
            // Ищем элемент в результатах поиска
            let found = false;
            const searchResults = Array.from(document.querySelectorAll('.ListItem, .chat-item-clickable, .contact-list-item'));
            for (const el of searchResults) {
              const nameEl = el.querySelector('.fullName, .title, .peer-title, .chat-title');
              if (nameEl && nameEl.textContent && nameEl.textContent.trim().toLowerCase().includes(contact.name.toLowerCase())) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(r => setTimeout(r, 200));
                el.click();
                found = true;
                break;
              }
            }
            if (found) {
              await new Promise(r => setTimeout(r, 1200));
              // После клика по результату поиска, очищаем поиск
              searchInput.value = '';
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          } else {
            console.warn('Search input not found for fallback chat switching.');
          }
        }
      }
      
      if (!switchSuccess) {
        console.warn(`Failed to switch to chat: ${contact.name} after ${maxSwitchAttempts} attempts. Skipping this contact.`);
        continue; // Пропускаем этот контакт
      }
      
      // Увеличиваем основную задержку после клика по контакту
      await new Promise(r => setTimeout(r, 2000)); // Увеличили до 2 секунд
      console.log('Main wait finished. Querying for input field...');

      const input = document.querySelector('[contenteditable="true"]');
      console.log('Input field found:', input);
      
      // === Вводим текст до поиска кнопки отправки ===
      if (input) {
        try {
          input.focus();
          await new Promise(r => setTimeout(r, 200));
          // Очищаем поле
          input.innerHTML = '';
          input.textContent = '';
          input.innerText = '';
          input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }));
          await new Promise(r => setTimeout(r, 100));
          // Вставляем текст с переносами
          input.innerHTML = msg.replace(/\n/g, '<br>');
          input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: msg }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          input.dispatchEvent(new Event('focus', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { key: 'End', bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 400)); // Даем Telegram время обновить кнопку
        } catch (e) {
          console.warn('Ошибка при вводе текста в input:', e);
        }
      }

      // === Теперь ищем кнопку отправки ===
      let send = null;
      const maxRetries = 20;
      const retryDelay = 150;
      let sendButtonSuccess = false;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        console.log(`Send button search attempt ${attempt + 1}/${maxRetries}`);
        
        // Основные селекторы для кнопки отправки
        const primarySelectors = [
          'button[aria-label="Send Message"]',
          'button[title="Send Message"]',
          'button[aria-label="Send"]',
          'button.btn-send',
          'button.send-button'
        ];
        
        // Проверяем основные селекторы
        for (const selector of primarySelectors) {
          send = document.querySelector(selector);
          if (send) {
            console.log(`Found send button with primary selector: ${selector}`);
            break;
          }
        }
        
        // Если основные селекторы не сработали, делаем интеллектуальный поиск
        if (!send && attempt >= 5) {
          console.log('Primary selectors failed, starting intelligent button analysis...');
          
          const allButtons = Array.from(document.querySelectorAll('button'));
          console.log(`Analyzing ${allButtons.length} buttons...`);
          
          // Функция для анализа кнопки на предмет того, является ли она кнопкой отправки текста
          const analyzeButton = (btn) => {
            const btnInfo = {
              element: btn,
              className: btn.className,
              ariaLabel: btn.getAttribute('aria-label') || '',
              title: btn.getAttribute('title') || '',
              innerHTML: btn.innerHTML || '',
              textContent: btn.textContent?.trim() || '',
              rect: btn.getBoundingClientRect()
            };
            
            // Проверяем признаки ГОЛОСОВОЙ кнопки (которую нужно ИЗБЕГАТЬ)
            const voiceIndicators = [
              btnInfo.innerHTML.includes('icon-microphone'),
              btnInfo.innerHTML.includes('microphone'),
              btnInfo.innerHTML.includes('voice'),
              btnInfo.innerHTML.includes('record'),
              btnInfo.ariaLabel.toLowerCase().includes('voice'),
              btnInfo.ariaLabel.toLowerCase().includes('record'),
              btnInfo.ariaLabel.toLowerCase().includes('microphone'),
              btnInfo.title.toLowerCase().includes('voice'),
              btnInfo.className.includes('voice'),
              btnInfo.className.includes('record')
            ];
            
            // Проверяем признаки ТЕКСТОВОЙ кнопки отправки (которую нужно НАЙТИ)
            const textSendIndicators = [
              btnInfo.innerHTML.includes('icon-send'),
              btnInfo.innerHTML.includes('send'),
              btnInfo.ariaLabel.toLowerCase().includes('send'),
              btnInfo.title.toLowerCase().includes('send'),
              btnInfo.className.includes('send'),
              btnInfo.className.includes('main-button'),
              btnInfo.className.includes('primary'),
              // Проверяем позицию (кнопка отправки обычно справа внизу)
              btnInfo.rect.right > window.innerWidth * 0.7 && btnInfo.rect.bottom > window.innerHeight * 0.7,
              // Проверяем размер (кнопка отправки обычно круглая, средних размеров)
              Math.abs(btnInfo.rect.width - btnInfo.rect.height) < 10 && btnInfo.rect.width > 30 && btnInfo.rect.width < 80
            ];
            
            const hasVoiceIndicators = voiceIndicators.some(Boolean);
            const hasTextSendIndicators = textSendIndicators.some(Boolean);
            
            console.log(`Button analysis:`, {
              hasVoiceIndicators,
              hasTextSendIndicators,
              voiceCount: voiceIndicators.filter(Boolean).length,
              textSendCount: textSendIndicators.filter(Boolean).length,
              position: `${Math.round(btnInfo.rect.right)}x${Math.round(btnInfo.rect.bottom)}`,
              size: `${Math.round(btnInfo.rect.width)}x${Math.round(btnInfo.rect.height)}`,
              className: btnInfo.className,
              ariaLabel: btnInfo.ariaLabel
            });
            
            return {
              isVoiceButton: hasVoiceIndicators,
              isTextSendButton: hasTextSendIndicators && !hasVoiceIndicators,
              confidence: textSendIndicators.filter(Boolean).length - voiceIndicators.filter(Boolean).length,
              info: btnInfo
            };
          };
          
          // Анализируем все кнопки и находим лучшего кандидата
          const buttonAnalysis = allButtons.map(analyzeButton);
          
          // Фильтруем только кнопки отправки текста (исключаем голосовые)
          const textSendCandidates = buttonAnalysis.filter(analysis => 
            analysis.isTextSendButton && !analysis.isVoiceButton
          );
          
          if (textSendCandidates.length > 0) {
            // Сортируем по уверенности (confidence) и выбираем лучшего кандидата
            textSendCandidates.sort((a, b) => b.confidence - a.confidence);
            send = textSendCandidates[0].element;
            console.log('Found text send button via intelligent analysis:', {
              confidence: textSendCandidates[0].confidence,
              className: send.className,
              ariaLabel: send.getAttribute('aria-label')
            });
          } else {
            console.log('No suitable text send button found in intelligent analysis');
            
            // В качестве последней попытки ищем любую кнопку с минимальными признаками отправки
            const fallbackCandidates = buttonAnalysis.filter(analysis => 
              !analysis.isVoiceButton && analysis.confidence > -2
            );
            
            if (fallbackCandidates.length > 0) {
              fallbackCandidates.sort((a, b) => b.confidence - a.confidence);
              send = fallbackCandidates[0].element;
              console.log('Using fallback send button:', {
                confidence: fallbackCandidates[0].confidence,
                className: send.className
              });
            }
          }
        }
        
        if (send) {
          // Дополнительная финальная проверка - убеждаемся что это не голосовая кнопка
          const hasSendIcon = send.innerHTML.includes('icon-send');
          const hasVoiceIcon = send.innerHTML.includes('icon-microphone') || send.innerHTML.includes('icon-microphone-alt') || send.innerHTML.includes('voice');
          const isVoiceOnly = hasVoiceIcon && !hasSendIcon;
          if (isVoiceOnly) {
            console.warn('Found button appears to be voice-only button, rejecting and continuing search...');
            send = null;
          } else {
            console.log('Send button passed final validation');
            sendButtonSuccess = true;
            break;
          }
        }
        
        if (attempt < maxRetries - 1) {
          console.log(`Send button not found, retrying in ${retryDelay}ms...`);
          await new Promise(r => setTimeout(r, retryDelay));
        }
      }
      if (sendButtonSuccess) {
        console.log('Send button search: SUCCESS');
      } else {
        console.warn('Send button search: FAILED after all attempts');
      }

      // Проверяем результаты поиска
      if (!input) {
        console.warn('Не найдено поле ввода для контакта:', contact.name);
      }
      
      if (!send) {
        console.warn('Не найдена кнопка отправки для контакта (после расширенного поиска):', contact.name);
      } else {
        console.log('Final send button selection:', {
          className: send.className,
          ariaLabel: send.getAttribute('aria-label'),
          innerHTML: send.innerHTML.substring(0, 100) + '...'
        });
      }

      if (input && send) {
        let sendSuccess = false;
        try {
          console.log('Focusing input field...');
          input.focus();
          await new Promise(r => setTimeout(r, 300));
          
          console.log('Clearing input field completely...');
          // Полностью очищаем поле ввода
          input.innerHTML = '';
          input.textContent = '';
          input.innerText = '';
          
          // Отправляем событие очистки
          input.dispatchEvent(new InputEvent('input', { 
            bubbles: true, 
            cancelable: true,
            inputType: 'deleteContentBackward'
          }));
          
          await new Promise(r => setTimeout(r, 200));
          
          console.log('Setting input field content with comprehensive approach...');
          
          // Метод 1: Установка через innerHTML с обработкой переносов
          input.innerHTML = msg.replace(/\n/g, '<br>');
          
          // Метод 2: Если innerHTML не сработал, используем textContent
          if (!input.innerHTML.trim()) {
            input.textContent = msg;
          }
          
          // Метод 3: Симуляция пользовательского ввода по символам
          if (!input.textContent.trim() && !input.innerHTML.trim()) {
            console.log('Manual character input simulation...');
            for (let i = 0; i < msg.length; i++) {
              const char = msg[i];
              
              // Добавляем символ к существующему содержимому
              if (char === '\n') {
                input.innerHTML += '<br>';
              } else {
                input.innerHTML += char;
              }
              
              // Отправляем события для каждого символа
              input.dispatchEvent(new KeyboardEvent('keydown', {
                key: char,
                code: `Key${char.toUpperCase()}`,
                bubbles: true,
                cancelable: true
              }));
              
              input.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: char
              }));
              
              // Небольшая задержка между символами для реалистичности
              if (i % 10 === 0) { // Задержка каждые 10 символов
                await new Promise(r => setTimeout(r, 10));
              }
            }
          }
          
          // Отправляем финальные события
          console.log('Dispatching final input events...');
          input.dispatchEvent(new InputEvent('input', { 
            bubbles: true, 
            cancelable: true,
            inputType: 'insertText',
            data: msg
          }));
          
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          input.dispatchEvent(new Event('focus', { bubbles: true }));
          
          // Дополнительные события клавиатуры
          input.dispatchEvent(new KeyboardEvent('keyup', { 
            key: 'End',
            bubbles: true, 
            cancelable: true 
          }));
          
          await new Promise(r => setTimeout(r, 500)); // Увеличили задержку
          
          console.log('Final input verification:', {
            innerHTML: input.innerHTML,
            textContent: input.textContent,
            innerText: input.innerText,
            value: input.value
          });
          
          // Убеждаемся, что текст действительно установлен
          const hasText = input.innerHTML.trim() || input.textContent.trim() || input.innerText.trim();
          
          if (!hasText) {
            console.warn('Input field still appears empty, trying last resort method...');
            // Последняя попытка - прямая установка содержимого и принудительные события
            input.innerHTML = msg.replace(/\n/g, '<br>');
            input.focus();
            
            // Принудительно вызываем событие input
            const forceInputEvent = new Event('input', { bubbles: true });
            Object.defineProperty(forceInputEvent, 'target', { value: input });
            Object.defineProperty(forceInputEvent, 'data', { value: msg });
            input.dispatchEvent(forceInputEvent);
            
            await new Promise(r => setTimeout(r, 200));
          }
          
          // КРИТИЧЕСКИ ВАЖНО: повторно находим кнопку отправки после изменения контента
          console.log('Re-querying send button after content changes...');
          let updatedSend = document.querySelector('button[aria-label="Send Message"]');
          
          if (!updatedSend) {
            console.log('Primary send button selector failed, trying alternatives...');
            // Расширенный поиск кнопки отправки
            const allButtons = Array.from(document.querySelectorAll('button'));
            
            updatedSend = allButtons.find(btn => {
              // Проверяем различные признаки кнопки отправки
              const hasIconSend = btn.querySelector('.icon-send');
              const hasAriaLabel = btn.getAttribute('aria-label') === 'Send Message';
              const hasTitle = btn.getAttribute('title') === 'Send Message';
              const hasMainButton = btn.classList.contains('main-button');
              const hasSecondaryRound = btn.classList.contains('secondary') && btn.classList.contains('round');
              
              // Проверяем текстовое содержимое (может содержать иконку отправки)
              const btnText = btn.textContent.trim().toLowerCase();
              const hasTextSend = btnText.includes('send') || btnText === '';
              
              // Проверяем позицию кнопки (кнопка отправки обычно в правом нижнем углу)
              const rect = btn.getBoundingClientRect();
              const isInSendPosition = rect.right > window.innerWidth * 0.8 && rect.bottom > window.innerHeight * 0.8;
              
              return hasIconSend || hasAriaLabel || hasTitle || hasMainButton || 
                     (hasSecondaryRound && (hasTextSend || isInSendPosition));
            });
          }
          
          if (updatedSend && updatedSend !== send) {
            console.log('Found updated send button:', updatedSend);
            send = updatedSend;
          }
          
          // Дополнительная проверка: убеждаемся, что это кнопка для текста, а не для голоса
          const sendButtonInfo = {
            className: send.className,
            ariaLabel: send.getAttribute('aria-label'),
            title: send.getAttribute('title'),
            innerHTML: send.innerHTML.substring(0, 150),
            hasVoiceIcon: send.innerHTML.includes('icon-microphone') || send.innerHTML.includes('voice'),
            hasTextIcon: send.innerHTML.includes('icon-send') || send.innerHTML.includes('send')
          };
          
          console.log('Send button analysis:', sendButtonInfo);
          
          // Если кнопка содержит иконку микрофона, это может быть проблемой
          if (sendButtonInfo.hasVoiceIcon && !sendButtonInfo.hasTextIcon) {
            console.warn('Send button appears to be for voice, trying to find text send button...');
            
            // Ищем специально кнопку для текстовых сообщений
            const textSendButton = Array.from(document.querySelectorAll('button')).find(btn => {
              return btn.innerHTML.includes('icon-send') && !btn.innerHTML.includes('icon-microphone');
            });
            
            if (textSendButton) {
              console.log('Found dedicated text send button:', textSendButton);
              send = textSendButton;
            }
          }
          
          console.log('Attempting to send message with enhanced methods...');
          
          // Метод 1: Убеждаемся что поле активно и нажимаем Enter
          console.log('Method 1: Enter key with active input');
          input.focus();
          await new Promise(r => setTimeout(r, 100));
          
          const enterKeyEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false
          });
          
          input.dispatchEvent(enterKeyEvent);
          await new Promise(r => setTimeout(r, 300));
          
          // Метод 2: Клик по кнопке с проверкой состояния
          console.log('Method 2: Enhanced button click');
          if (send && !send.disabled) {
            // Сначала наводим мышь на кнопку
            send.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            await new Promise(r => setTimeout(r, 50));
            
            // Затем делаем полную последовательность клика
            send.dispatchEvent(new MouseEvent('mousedown', { 
              bubbles: true, 
              cancelable: true,
              button: 0,
              buttons: 1
            }));
            
            await new Promise(r => setTimeout(r, 50));
            
            send.dispatchEvent(new MouseEvent('mouseup', { 
              bubbles: true, 
              cancelable: true,
              button: 0,
              buttons: 0
            }));
            
            send.dispatchEvent(new MouseEvent('click', { 
              bubbles: true, 
              cancelable: true,
              button: 0,
              buttons: 0
            }));
            
            await new Promise(r => setTimeout(r, 200));
          }
          
          // Метод 3: Программная отправка через события формы
          console.log('Method 3: Form submission simulation');
          const form = input.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 200));
          }
          
          // Метод 4: Поиск и клик по любой кнопке отправки в области чата
          console.log('Method 4: Comprehensive send button search');
          const chatArea = input.closest('.chat-input-container, .input-container, .message-input-wrapper');
          if (chatArea) {
            const sendButtons = chatArea.querySelectorAll('button');
            for (const btn of sendButtons) {
              if (btn !== send && !btn.disabled) {
                console.log('Trying alternative send button:', btn);
                btn.click();
                await new Promise(r => setTimeout(r, 100));
              }            }
          }
          
          console.log('All enhanced send methods completed. Extended wait for message delivery...');
          await new Promise(r => setTimeout(r, 1500)); // Увеличили время ожидания
          console.log('Message sending process completed for:', contact.name);
          
          sendSuccess = true;
        } catch (e) {
          console.error('Error in enhanced message sending for:', contact.name, e);
        }
        if (sendSuccess) {
          console.log('Message send: SUCCESS for', contact.name);
        } else {
          console.warn('Message send: FAILED for', contact.name);
        }
      } else {
        // Updated warning to reflect retries
        console.warn('Не удалось отправить сообщение для', contact.name, '- поле ввода или кнопка (даже после нескольких попыток) не найдены.');
      }
    }
    // Показываем overlay обратно после завершения
    overlay.style.display = 'flex';
    console.log('Overlay restored');
    alert('Сообщения отправлены!');
    console.log('Bulk message sending finished.');
    overlay.remove();
  };
})();
