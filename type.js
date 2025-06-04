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
      const items = document.querySelectorAll('.chat-list.custom-scroll .contact-list-item');
      if (items.length > 0) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }
  const ok = await waitForContactsList();
  if (!ok) {
    alert('Контакты не найдены! Открой их вручную и повтори скрипт.');
    return;
  }  // --- 4. Просим пользователя проскроллить контакты вручную ---
  const scrollOverlay = document.createElement('div');
  Object.assign(scrollOverlay.style, {
    position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh',
    pointerEvents: 'none', // overlay не блокирует клики
    background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  const scrollPanel = document.createElement('div');
  Object.assign(scrollPanel.style, {
    background: '#fff', padding: '28px', borderRadius: '12px', width: '420px', maxWidth: '90vw',
    boxShadow: '0 4px 24px #0002', fontFamily: 'sans-serif', color: '#222', textAlign: 'center',
    pointerEvents: 'auto' // только панель ловит клики
  });
  const scrollTitle = document.createElement('h2');
  scrollTitle.innerText = 'Прокрутите список контактов';
  scrollPanel.appendChild(scrollTitle);
  const scrollText = document.createElement('div');
  
  // --- 4. Собираем контакты ---
  // Массив для накопления уникальных элементов контактов
  const contactDivsArr = [];
  const contactKeysSet = new Set(); // теперь фильтруем по ключу
  
  function updateScrollText() {
    scrollText.innerHTML =
      'Пожалуйста, вручную прокрутите <b>список контактов</b> вниз до самого конца, чтобы все контакты были загружены.<br><br>' +
      '<b>Когда закончите — нажмите кнопку "Готово" ниже.</b><br><br>' +
      `<span style="color:#48a1ec;font-weight:bold;">Найдено контактов: ${contactDivsArr.length}</span>`;
  }
  updateScrollText();
  scrollText.style.margin = '18px 0 24px 0';
  scrollPanel.appendChild(scrollText);
  const readyBtn = document.createElement('button');
  readyBtn.textContent = 'Готово';
  readyBtn.style.padding = '12px 32px';
  readyBtn.style.fontSize = '1.1em';
  readyBtn.style.background = '#48a1ec';
  readyBtn.style.color = '#fff';
  readyBtn.style.border = 'none';
  readyBtn.style.borderRadius = '7px';
  readyBtn.style.cursor = 'pointer';
  readyBtn.style.fontWeight = 'bold';
  readyBtn.style.marginTop = '10px';
  scrollPanel.appendChild(readyBtn);
  scrollOverlay.appendChild(scrollPanel);
  document.body.appendChild(scrollOverlay);
  function getContactKey(div) {
    // Пробуем найти уникальный id, если есть
    const peerId = div.getAttribute('data-peer-id') || div.dataset.peerId;
    if (peerId) return peerId;
    // Если нет id, используем имя
    const nameEl = div.querySelector('.fullName');
    const name = nameEl ? nameEl.textContent.trim() : '';
    return name;
  }
  function scanVisibleContacts() {
    const newDivs = Array.from(document.querySelectorAll('.chat-list.custom-scroll .contact-list-item'));
    newDivs.forEach(div => {
      const key = getContactKey(div);
      if (key && !contactKeysSet.has(key)) {
        contactKeysSet.add(key);
        contactDivsArr.push(div);
      }
    });
    // Отладка: показываем сколько всего уникальных контактов накоплено
    const names = contactDivsArr.map(item => {
      const nameEl = item.querySelector('.fullName');
      return nameEl ? nameEl.textContent.trim() : '(Без имени)';
    });
    console.log('[TGSENDER][DEBUG] Накоплено контактов (уникальных):', contactDivsArr.length, names);
    updateScrollText(); // update banner count
  }
  // Запускаем периодический сбор сразу после overlay
  let scanInterval = setInterval(scanVisibleContacts, 300);

  await new Promise(resolve => {
    readyBtn.onclick = () => {
      // Останавливаем сбор при нажатии 'Готово'
      clearInterval(scanInterval);
      // Финальный отладочный вывод
      const names = contactDivsArr.map(item => {
        const nameEl = item.querySelector('.fullName');
        return nameEl ? nameEl.textContent.trim() : '(Без имени)';
      });
      console.log('[TGSENDER][DEBUG] Итоговый список контактов:', contactDivsArr.length, names);
      scrollOverlay.remove();
      resolve();
    };
  });

  // Формируем массив контактов для рассылки (только уникальные по ключу)
  const usedKeys = new Set();
  const contacts = contactDivsArr.map(item => {
    const button = item.querySelector('.ListItem-button[role="button"]');
    const nameEl = item.querySelector('.fullName');
    const name = nameEl ? nameEl.textContent.trim() : '(Без имени)';
    const key = getContactKey(item);
    if (!button || !name || !key || usedKeys.has(key)) return null;
    usedKeys.add(key);
    return { name, element: button };
  }).filter(Boolean);

  // Отладка: выводим список контактов в консоль
  console.log('[TGSENDER] Получено контактов:', contacts.length, contacts.map(c => c.name));

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

  // --- Состояние выбранных контактов ---
  const selectedContactIndexes = new Set(contacts.map((_, i) => i)); // по умолчанию все выбраны

  function renderContactList(filter = '') {
    list.innerHTML = '';
    contacts.forEach((c, i) => {
      if (!filter || c.name.toLowerCase().includes(filter)) {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '8px'; // Всегда отступ между контактами
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = i;
        cb.checked = selectedContactIndexes.has(i);
        cb.addEventListener('change', () => {
          if (cb.checked) {
            selectedContactIndexes.add(i);
          } else {
            selectedContactIndexes.delete(i);
          }
        });
        label.appendChild(cb);
        label.append(' ' + c.name);
        list.appendChild(label);
      }
    });
  }
  renderContactList();

  panel.appendChild(list);

  // Функция фильтрации
  filterInput.addEventListener('input', () => {
    const val = filterInput.value.trim().toLowerCase();
    renderContactList(val);
  });

  btnAll.onclick = () => {
    contacts.forEach((_, i) => selectedContactIndexes.add(i));
    renderContactList(filterInput.value.trim().toLowerCase());
  };
  btnNone.onclick = () => {
    selectedContactIndexes.clear();
    renderContactList(filterInput.value.trim().toLowerCase());
  };
  btnInvert.onclick = () => {
    contacts.forEach((_, i) => {
      if (selectedContactIndexes.has(i)) {
        selectedContactIndexes.delete(i);
      } else {
        selectedContactIndexes.add(i);
      }
    });
    renderContactList(filterInput.value.trim().toLowerCase());
  };

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
    const selected = Array.from(selectedContactIndexes).map(i => contacts[i]);
    if (!selected.length) return alert('Выберите хотя бы один контакт!');
    if (!confirm(`Отправить сообщение в ${selected.length} контактов?`)) return;

    sendBtn.disabled = true;
    closeBtn.disabled = true;
    btnAll.disabled = btnNone.disabled = btnInvert.disabled = true;
    console.log('Starting bulk message sending...');

    // Скрываем overlay во время отправки, чтобы он не блокировал клики
    overlay.style.display = 'none';
    console.log('Overlay hidden to prevent click blocking');

    let failedCount = 0;
    let successCount = 0;
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
            const contactsList = document.querySelector('.chat-list.custom-scroll .contact-list-item');
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
            const contactsList = document.querySelector('.chat-list.custom-scroll .contact-list-item');
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
                const contactsList = document.querySelector('.chat-list.custom-scroll .contact-list-item');
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
              const contactsList = document.querySelector('.chat-list.custom-scroll .contact-list-item');
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
      // Используем только поиск для переключения на контакт
      console.log('Starting search for contact:', contact.name);
      let switchSuccess = false;
      
      // Поиск через строку поиска Telegram Web - теперь это основной и единственный метод
      {
          console.log('Trying to switch chat via search bar...');
          // Ищем строку поиска
          let searchInput = document.querySelector('input[type="search"], input[placeholder*="earch"], .search-input input');
          if (searchInput) {
            console.log('Search input found:', searchInput);
            searchInput.focus();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 200));
            // Вводим имя контакта
            console.log(`Typing contact name: "${contact.name}" into search input.`);
            for (let charIndex = 0; charIndex < contact.name.length; charIndex++) {
              searchInput.value += contact.name[charIndex];
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              await new Promise(r => setTimeout(r, 50)); // Adjusted timing slightly
            }
            await new Promise(r => setTimeout(r, 700)); // Wait for search results to populate
            // Ищем элемент в результатах поиска
            let foundInSearch = false; // Renamed to avoid conflict with outer 'found'
            const searchResults = Array.from(document.querySelectorAll('.ListItem, .chat-item-clickable, .contact-list-item'));
            console.log(`Found ${searchResults.length} items in search results after typing name.`);

            for (const el of searchResults) {
              const nameEl = el.querySelector('.fullName, .title, .peer-title, .chat-title');
              if (nameEl && nameEl.textContent && nameEl.textContent.trim().toLowerCase().includes(contact.name.toLowerCase())) {
                console.log('Matching contact found in search results list:', nameEl.textContent.trim(), el);
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(r => setTimeout(r, 500));

                // КРИТИЧЕСКОЕ УЛУЧШЕНИЕ: явно ищем и используем ссылку (a) из результатов поиска
                console.log('Contact element structure analysis:', {
                  html: el.outerHTML.substring(0, 500),
                  childNodes: Array.from(el.childNodes).map(node => node.nodeName),
                  hasAnchor: !!el.querySelector('a')
                });
                
                // Поиск элемента <a> с атрибутом href - САМЫЙ ПРИОРИТЕТНЫЙ метод
                const anchorElement = el.querySelector('a[href], a.ListItem-button');
                if (anchorElement) {
                  console.log('Found anchor element with href:', anchorElement.getAttribute('href') || 'no-href');
                }
                
                // Метод 1: Прямой доступ по URL - самый надежный способ переключения
                try {
                  if (anchorElement && anchorElement.getAttribute('href')) {
                    const contactHref = anchorElement.getAttribute('href');
                    console.log('Using direct URL navigation to contact:', contactHref);
                    
                    // Записываем оригинальное местоположение
                    const originalHash = window.location.hash;
                    
                    // Направляем на новый URL
                    if (contactHref.startsWith('#')) {
                      console.log('Navigating to hash URL:', contactHref);
                      window.location.hash = contactHref;
                    } else if (contactHref.startsWith('/')) {
                      console.log('Navigating to path URL:', contactHref);
                      window.location.pathname = contactHref;
                    } else {
                      console.log('Setting complete URL:', contactHref);
                      window.location.href = contactHref;
                    }
                    
                    // Даем время для перехода
                    await new Promise(r => setTimeout(r, 500));
                    
                    // Проверяем результат (если хэш не изменился, значит URL-навигация не сработала)
                    if (window.location.hash === originalHash && contactHref !== originalHash) {
                      console.log('URL navigation did not change the hash, will try direct click methods');
                    } else {
                      console.log('URL navigation succeeded, hash changed to:', window.location.hash);
                      // Пропускаем остальные методы клика, так как URL-навигация сработала
                      foundInSearch = true;
                      break;
                    }
                  }
                } catch (urlError) {
                  console.warn('URL navigation error:', urlError);
                }
                
                // Если URL-навигация не сработала, используем прямые клики
                console.log('Proceeding with direct click methods');
                
                // Определяем элемент для клика в порядке приоритета
                let elementToClick = null;
                
                // Выбор элемента для клика в порядке приоритета
                if (anchorElement) {
                  // Приоритет 1: Явная ссылка <a> - лучший вариант
                  elementToClick = anchorElement;
                  console.log('PRIORITY 1: Using direct anchor element for click');
                } else {
                  // Если нет ссылки, пробуем остальные варианты поиска
                  const listItemButton = el.querySelector('.ListItem-button[role="button"]');
                  
                  // Ищем ripple-container по разным путям
                  let rippleInChatInfo = null;
                  if (listItemButton) {
                    const chatInfo = listItemButton.querySelector('.ChatInfo');
                    if (chatInfo) {
                      rippleInChatInfo = chatInfo.querySelector('.ripple-container');
                    }
                  }
                  
                  // Другие варианты ripple-container
                  const rippleInListItem = listItemButton ? listItemButton.querySelector('.ripple-container') : null;
                  const rippleGeneral = el.querySelector('.ripple-container');
                  
                  // Выбираем элемент в порядке предпочтения
                  if (listItemButton) {
                    elementToClick = listItemButton;
                    console.log('PRIORITY 2: Using ListItem-button for click');
                  } else if (rippleInChatInfo && rippleInChatInfo.getBoundingClientRect().width > 0) {
                    elementToClick = rippleInChatInfo;
                    console.log('PRIORITY 3: Using ripple-container inside ChatInfo for click');
                  } else if (rippleInListItem && rippleInListItem.getBoundingClientRect().width > 0) {
                    elementToClick = rippleInListItem;
                    console.log('PRIORITY 4: Using ripple-container in ListItem-button for click');
                  } else if (rippleGeneral && rippleGeneral.getBoundingClientRect().width > 0) {
                    elementToClick = rippleGeneral;
                    console.log('PRIORITY 5: Using general ripple-container for click');
                  } else {
                    elementToClick = el;
                    console.log('PRIORITY 6: Using main element for click in search as last resort');
                  }
                }

                console.log('Selected element for click:', elementToClick.tagName, elementToClick.className);

                // Последовательно пробуем разные методы клика
                let clickSuccess = false;

                // Метод A: Выполнение встроенного onClick обработчика
                if (!clickSuccess && elementToClick.onclick) {
                  console.log('Method A: Executing onclick handler directly');
                  try {
                    elementToClick.onclick();
                    clickSuccess = true;
                    console.log('onclick handler executed successfully');
                  } catch (e) {
                    console.warn('onclick handler execution failed:', e);
                  }
                  await new Promise(r => setTimeout(r, 300));
                }
                
                // Метод B: Прямой .click() на элемент
                if (!clickSuccess) {
                  console.log('Method B: Direct .click() method');
                  try {
                    elementToClick.click();
                    
                    // Дополнительно если это ссылка, проверяем что переход произошел
                    if (elementToClick.tagName === 'A' && elementToClick.href) {
                      await new Promise(r => setTimeout(r, 300));
                      console.log('Direct link click performed');
                    }
                  } catch (e) {
                    console.warn('Direct click failed:', e);
                  }
                  await new Promise(r => setTimeout(r, 300));
                }
                
                // Метод C: Полная последовательность событий мыши
                console.log('Method C: Enhanced mouse event sequence');
                try {
                  // Получаем координаты центра элемента
                  const rect = elementToClick.getBoundingClientRect();
                  const centerX = rect.left + rect.width / 2;
                  const centerY = rect.top + rect.height / 2;
                  
                  // 1. Предварительные события (наведение мыши)
                  console.log('1. Sending mouseover/mouseenter events');
                  elementToClick.dispatchEvent(new MouseEvent('mouseover', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: centerX,
                    clientY: centerY
                  }));
                  
                  elementToClick.dispatchEvent(new MouseEvent('mouseenter', {
                    bubbles: false,
                    cancelable: true,
                    view: window,
                    clientX: centerX,
                    clientY: centerY
                  }));
                  
                  await new Promise(r => setTimeout(r, 50));
                  
                  // 2. События нажатия
                  console.log('2. Sending mousedown event');
                  const mouseDownEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1,
                    clientX: centerX,
                    clientY: centerY
                  });
                  elementToClick.dispatchEvent(mouseDownEvent);
                  
                  await new Promise(r => setTimeout(r, 50));
                  
                  // 3. События отпускания
                  console.log('3. Sending mouseup and click events');
                  const mouseUpEvent = new MouseEvent('mouseup', {
                    bubbles: true, 
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 0,
                    clientX: centerX,
                    clientY: centerY
                  });
                  elementToClick.dispatchEvent(mouseUpEvent);
                  
                  const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 0,
                    clientX: centerX,
                    clientY: centerY
                  });
                  elementToClick.dispatchEvent(clickEvent);
                  
                  // Дополнительное событие для ссылок
                  if (elementToClick.tagName === 'A') {
                    console.log('4. Sending extra events for anchor element');
                    // Эмулируем нажатие клавиши Enter для ссылок
                    elementToClick.dispatchEvent(new KeyboardEvent('keydown', {
                      bubbles: true,
                      cancelable: true,
                      key: 'Enter',
                      code: 'Enter'
                    }));
                    
                    elementToClick.dispatchEvent(new KeyboardEvent('keyup', {
                      bubbles: true,
                      cancelable: true,
                      key: 'Enter',
                      code: 'Enter'
                    }));
                  }
                } catch (e) {
                  console.warn('Enhanced mouse event sequence failed:', e);
                }
                
                // Метод D: Программная навигация (если элемент это ссылка)
                if (elementToClick.tagName === 'A' && elementToClick.getAttribute('href')) {
                  console.log('Method D: Programmatic navigation for anchor');
                  try {
                    const href = elementToClick.getAttribute('href');
                    if (href.startsWith('#')) {
                      window.location.hash = href;
                    } else {
                      window.location.href = href;
                    }
                    console.log('Programmatic navigation executed');
                  } catch (e) {
                    console.warn('Programmatic navigation failed:', e);
                  }
                }
                
                foundInSearch = true;
                break;
              }
            }
            if (foundInSearch) {
              console.log(`Contact "${contact.name}" found in search and click attempted. Waiting for chat to open...`);
              await new Promise(r => setTimeout(r, 1200)); // Wait for chat to potentially open
              // После клика по результату поиска, очищаем поиск
              if (searchInput.value !== '') { // Clear only if not already cleared
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('Search input cleared after successful click.');
              }
              
              // Проверяем, что чат действительно открылся
              console.log('Verifying that the contact chat was opened successfully...');
              let currentChatName = null;
              let chatOpenSuccess = false;
              
              // Ищем имя активного чата
              for (let verifyAttempt = 0; verifyAttempt < 5; verifyAttempt++) {
                await new Promise(r => setTimeout(r, 500));
                
                // Ищем имя активного чата в основном контейнере
                const chatHeaderEl = document.querySelector('.chat-info-wrapper .ChatInfo .info .fullName, .chat-info-wrapper .ChatInfo .info .title h3');
                currentChatName = chatHeaderEl && chatHeaderEl.textContent.trim();
                
                if (currentChatName) {
                  console.log(`Found chat name: "${currentChatName}"`);
                  
                  // Проверяем соответствие имени (с учетом возможных вариаций)
                  const nameMatches = [
                    currentChatName === contact.name,
                    currentChatName.includes(contact.name),
                    contact.name.includes(currentChatName),
                    currentChatName.toLowerCase() === contact.name.toLowerCase(),
                    currentChatName.toLowerCase().includes(contact.name.toLowerCase()),
                    contact.name.toLowerCase().includes(currentChatName.toLowerCase())
                  ];
                  
                  if (nameMatches.some(Boolean)) {
                    console.log('Chat name matches contact name. Chat opened successfully!');
                    chatOpenSuccess = true;
                    switchSuccess = true;
                    break;
                  } else {
                    console.log(`Chat name does not match expected "${contact.name}"`);
                  }
                } else {
                  console.log('No chat name found yet, waiting...');
                }
              }
              
              if (!chatOpenSuccess) {
                console.warn(`Failed to verify that chat "${contact.name}" was opened. Will try to continue anyway.`);
              }
            } else {
              console.log(`Contact "${contact.name}" NOT found in search results after typing name.`);
            }
          } else {
            console.warn('Search input element NOT found for search-based chat switching.');
          }
      }
      
      if (!switchSuccess) {
        console.warn(`Failed to switch to chat: ${contact.name}. Skipping this contact.`);
        failedCount++;
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
          successCount++;
        } else {
          console.warn('Message send: FAILED for', contact.name);
          failedCount++;
        }
      } else {
        // Updated warning to reflect retries
        console.warn('Не удалось отправить сообщение для', contact.name, '- поле ввода или кнопка (даже после нескольких попыток) не найдены.');
        failedCount++;
      }
    }
    // Показываем overlay обратно после завершения
    overlay.style.display = 'flex';
    console.log('Overlay restored');
    
    // Показываем результаты рассылки с учетом успехов и неудач
    const resultMessage = `Результаты отправки:\n✅ Успешно: ${successCount}\n❌ Ошибок: ${failedCount}`;
    alert(resultMessage);
    console.log(`Bulk message sending finished. Success: ${successCount}, Failed: ${failedCount}`);
    overlay.remove();
  };
})();
