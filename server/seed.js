require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

// ── Booking / appointment template ──────────────────────────────────────────
const BOOKING_FLOW = {
  nodes: [
    {
      id: 'n1',
      type: 'start',
      data: { label: 'Старт' },
      position: { x: 300, y: 50 },
    },
    {
      id: 'n2',
      type: 'message',
      data: {
        label: 'Приветствие',
        text: 'Добро пожаловать! 👋\nВыберите действие в меню ниже.',
      },
      position: { x: 300, y: 170 },
    },
    {
      id: 'n_menu',
      type: 'menu',
      data: {
        label: 'Главное меню',
        buttons: [{ label: '📅 Записаться' }, { label: '❓ Помощь' }],
        saveAs: 'menu_choice',
      },
      position: { x: 300, y: 300 },
    },
    {
      id: 'n3',
      type: 'buttons',
      data: {
        label: 'Выбор услуги',
        text: 'Какую услугу вы хотите?',
        buttons: [{ label: 'Стрижка' }, { label: 'Маникюр' }, { label: 'Массаж' }],
        saveAs: 'service',
      },
      position: { x: 100, y: 460 },
    },
    {
      id: 'n5',
      type: 'question',
      data: { label: 'Выбор даты', text: 'Введите желаемую дату (например, 25 июня):', variableName: 'date', answerType: 'date' },
      position: { x: 100, y: 610 },
    },
    {
      id: 'n6',
      type: 'question',
      data: { label: 'Выбор времени', text: 'Введите удобное время:', variableName: 'time', answerType: 'time', dateVar: 'date' },
      position: { x: 100, y: 720 },
    },
    {
      id: 'n7',
      type: 'question',
      data: { label: 'Имя клиента', text: 'Как вас зовут?', variableName: 'name' },
      position: { x: 100, y: 830 },
    },
    {
      id: 'n8',
      type: 'buttons',
      data: {
        label: 'Подтверждение',
        text: 'Итог вашей записи:\n📌 Услуга: {{service}}\n📅 Дата: {{date}}\n🕐 Время: {{time}}\n👤 Имя: {{name}}\n\nПодтвердить запись?',
        buttons: [{ label: '✅ Подтвердить' }, { label: '❌ Отменить' }],
      },
      position: { x: 100, y: 940 },
    },
    {
      id: 'n9',
      type: 'notification',
      data: {
        label: 'Уведомление администратору',
        text: '📋 Новая запись!\nУслуга: {{service}}\nДата: {{date}}\nВремя: {{time}}\nКлиент: {{name}}',
      },
      position: { x: -80, y: 1090 },
    },
    {
      id: 'n10',
      type: 'message',
      data: {
        label: 'Успешное подтверждение',
        text: '✅ Вы успешно записались!\nУслуга: {{service}}\nДата: {{date}} в {{time}}\nДо встречи, {{name}}! 🎉',
      },
      position: { x: -80, y: 1200 },
    },
    { id: 'n12', type: 'end', data: { label: 'Конец (подтверждение)' }, position: { x: -80, y: 1310 } },
    {
      id: 'n11',
      type: 'message',
      data: { label: 'Отмена записи', text: '❌ Запись отменена.\nНажмите «📅 Записаться» чтобы начать заново.' },
      position: { x: 300, y: 1090 },
    },
    { id: 'n13', type: 'end', data: { label: 'Конец (отмена)' }, position: { x: 300, y: 1200 } },
    {
      id: 'n14',
      type: 'message',
      data: {
        label: 'Помощь',
        text: 'ℹ️ Как пользоваться ботом:\n\n1. Нажмите «📅 Записаться»\n2. Выберите услугу\n3. Укажите дату, время и имя\n4. Подтвердите запись\n\nДля перезапуска отправьте /start',
      },
      position: { x: 520, y: 460 },
    },
    { id: 'n15', type: 'end', data: { label: 'Конец (помощь)' }, position: { x: 520, y: 580 } },
  ],
  edges: [
    { id: 'e1-2',    source: 'n1',     target: 'n2' },
    { id: 'e2-m',    source: 'n2',     target: 'n_menu' },
    { id: 'em-3',    source: 'n_menu', target: 'n3',  sourceHandle: '📅 Записаться' },
    { id: 'em-14',   source: 'n_menu', target: 'n14', sourceHandle: '❓ Помощь' },
    { id: 'e3-5-s',  source: 'n3',     target: 'n5',  sourceHandle: 'Стрижка' },
    { id: 'e3-5-m',  source: 'n3',     target: 'n5',  sourceHandle: 'Маникюр' },
    { id: 'e3-5-ms', source: 'n3',     target: 'n5',  sourceHandle: 'Массаж' },
    { id: 'e5-6',    source: 'n5',     target: 'n6' },
    { id: 'e6-7',    source: 'n6',     target: 'n7' },
    { id: 'e7-8',    source: 'n7',     target: 'n8' },
    { id: 'e8-9',    source: 'n8',     target: 'n9',  sourceHandle: '✅ Подтвердить' },
    { id: 'e8-11',   source: 'n8',     target: 'n11', sourceHandle: '❌ Отменить' },
    { id: 'e9-10',   source: 'n9',     target: 'n10' },
    { id: 'e10-12',  source: 'n10',    target: 'n12' },
    { id: 'e11-13',  source: 'n11',    target: 'n13' },
    { id: 'e14-15',  source: 'n14',    target: 'n15' },
  ],
};

// ── Lead capture / site forms template ──────────────────────────────────────
const LEAD_FLOW = {
  nodes: [
    {
      id: 'n1',
      type: 'start',
      data: { label: 'Старт' },
      position: { x: 300, y: 50 },
    },
    {
      id: 'n2',
      type: 'message',
      data: {
        label: 'Добро пожаловать',
        text:
          '👋 Этот бот уведомляет вас в Telegram каждый раз, когда кто-то заполняет форму на вашем сайте.\n\n' +
          '📌 Ваш персональный Webhook URL - в настройках бота (кнопка ⚙️ вверху).\n\n' +
          'Вставьте его в форму обратной связи - и заявки будут приходить прямо сюда.',
      },
      position: { x: 300, y: 170 },
    },
    {
      id: 'n3',
      type: 'menu',
      data: {
        label: 'Главное меню',
        buttons: [
          { label: '📋 Заявки' },
          { label: '📎 Как подключить' },
          { label: '❓ Помощь' },
        ],
        saveAs: 'menu_choice',
      },
      position: { x: 300, y: 330 },
    },

    // ── Ветка «Заявки» ──
    {
      id: 'n4',
      type: 'message',
      data: {
        label: 'О заявках',
        text:
          '📋 Новые заявки приходят автоматически - вы получите уведомление сразу после того, как кто-то отправит форму на вашем сайте.\n\n' +
          'Формат уведомления:\n' +
          '📬 <b>Новая заявка с сайта</b>\n' +
          '👤 Имя: Иван Иванов\n' +
          '📧 Email: ivan@example.com\n' +
          '📞 Телефон: +7 999 000-00-00\n' +
          '💬 Сообщение: Хочу узнать о ценах\n\n' +
          'Убедитесь, что в настройках бота указан ваш Telegram ID администратора.',
      },
      position: { x: 0, y: 500 },
    },

    // ── Ветка «Как подключить» ──
    {
      id: 'n5',
      type: 'message',
      data: {
        label: 'Инструкция по подключению',
        text:
          '📎 <b>Подключение формы на сайте</b>\n\n' +
          '1️⃣ Скопируйте Webhook URL из настроек бота (кнопка ⚙️).\n\n' +
          '2️⃣ <b>HTML-форма</b> - укажите URL в action:\n' +
          '<form action="ВАШ_WEBHOOK_URL" method="post">\n' +
          '  <input name="name" placeholder="Имя">\n' +
          '  <input name="email" placeholder="Email">\n' +
          '  <input name="phone" placeholder="Телефон">\n' +
          '  <textarea name="message"></textarea>\n' +
          '  <button type="submit">Отправить</button>\n' +
          '</form>\n\n' +
          '3️⃣ <b>JavaScript fetch()</b>:\n' +
          'fetch("ВАШ_WEBHOOK_URL", {\n' +
          '  method: "POST",\n' +
          '  headers: {"Content-Type": "application/json"},\n' +
          '  body: JSON.stringify({name, email, phone, message})\n' +
          '})\n\n' +
          '✅ Поддерживаются любые поля - бот покажет все, что вы передадите.',
      },
      position: { x: 300, y: 500 },
    },

    // ── Ветка «Помощь» ──
    {
      id: 'n6',
      type: 'message',
      data: {
        label: 'Помощь',
        text:
          '❓ <b>Частые вопросы</b>\n\n' +
          '• <b>Уведомления не приходят</b> - проверьте, что Telegram ID администратора указан в настройках и бот запущен.\n\n' +
          '• <b>Форма не отправляется</b> - убедитесь, что Webhook URL скопирован полностью и форма отправляет POST-запрос.\n\n' +
          '• <b>Нужны другие поля</b> - добавьте их с любым именем, бот покажет все переданные данные.\n\n' +
          '• <b>CORS-ошибка</b> - сервер принимает запросы с любого домена, проверьте правильность URL.\n\n' +
          'Для перезапуска отправьте /start',
      },
      position: { x: 600, y: 500 },
    },
  ],
  edges: [
    { id: 'e1-2',  source: 'n1', target: 'n2' },
    { id: 'e2-3',  source: 'n2', target: 'n3' },
    // Menu branches
    { id: 'e3-4',  source: 'n3', target: 'n4', sourceHandle: '📋 Заявки' },
    { id: 'e3-5',  source: 'n3', target: 'n5', sourceHandle: '📎 Как подключить' },
    { id: 'e3-6',  source: 'n3', target: 'n6', sourceHandle: '❓ Помощь' },
    // Loop all branches back to menu
    { id: 'e4-3',  source: 'n4', target: 'n3' },
    { id: 'e5-3',  source: 'n5', target: 'n3' },
    { id: 'e6-3',  source: 'n6', target: 'n3' },
  ],
};

// ── FAQ / Knowledge base template ───────────────────────────────────────────
const FAQ_FLOW = {
  nodes: [
    { id: 'n1', type: 'start', data: { label: 'Старт' }, position: { x: 320, y: 40 } },
    {
      id: 'n2', type: 'message',
      data: {
        label: 'Приветствие',
        text: '👋 Добро пожаловать!\n\nЗдесь вы найдёте ответы на частые вопросы.\nВыберите нужную категорию 👇',
      },
      position: { x: 320, y: 160 },
    },
    {
      id: 'n3', type: 'menu',
      data: {
        label: 'Категории',
        buttons: [
          { label: '🏢 О компании' },
          { label: '🛒 Товары и услуги' },
          { label: '💳 Оплата и доставка' },
          { label: '📞 Контакты' },
        ],
        saveAs: 'faq_category',
      },
      position: { x: 320, y: 310 },
    },

    // ── О компании ──
    {
      id: 'n_about_q', type: 'buttons',
      data: {
        label: 'Вопросы о компании',
        text: '🏢 Выберите вопрос:',
        buttons: [
          { label: '❓ Кто вы такие?' },
          { label: '📍 Где находитесь?' },
          { label: '🕐 Режим работы' },
        ],
      },
      position: { x: 0, y: 500 },
    },
    {
      id: 'n_a1', type: 'message',
      data: {
        label: 'Кто мы',
        text: '🏢 <b>О нас</b>\n\nМы - [название компании], работаем с [год].\n\n[Краткое описание деятельности и главных преимуществ].',
      },
      position: { x: -220, y: 660 },
    },
    {
      id: 'n_a2', type: 'message',
      data: {
        label: 'Адрес',
        text: '📍 <b>Наш адрес</b>\n\n[Город, улица, дом]\n\nКак добраться: [описание или ссылка на карту].',
      },
      position: { x: 0, y: 660 },
    },
    {
      id: 'n_a3', type: 'message',
      data: {
        label: 'Режим работы',
        text: '🕐 <b>Режим работы</b>\n\nПн–Пт: 9:00–18:00\nСб: 10:00–16:00\nВс: выходной',
      },
      position: { x: 220, y: 660 },
    },

    // ── Товары и услуги ──
    {
      id: 'n_svc_q', type: 'buttons',
      data: {
        label: 'Вопросы об услугах',
        text: '🛒 Выберите вопрос:',
        buttons: [
          { label: '📦 Что вы предлагаете?' },
          { label: '💰 Сколько стоит?' },
          { label: '⭐ Гарантия' },
        ],
      },
      position: { x: 440, y: 500 },
    },
    {
      id: 'n_s1', type: 'message',
      data: {
        label: 'Ассортимент',
        text: '📦 <b>Наши товары и услуги</b>\n\n[Перечислите основные категории]\n\nДля заказа нажмите «🛒 Сделать заказ».',
      },
      position: { x: 320, y: 660 },
    },
    {
      id: 'n_s2', type: 'message',
      data: {
        label: 'Цены',
        text: '💰 <b>Цены</b>\n\n[Укажите основные ценовые позиции или диапазон]\n\nТочную стоимость рассчитаем индивидуально.',
      },
      position: { x: 500, y: 660 },
    },
    {
      id: 'n_s3', type: 'message',
      data: {
        label: 'Гарантия',
        text: '⭐ <b>Гарантия</b>\n\n[Сроки гарантии, что покрывает, как воспользоваться].',
      },
      position: { x: 680, y: 660 },
    },

    // ── Оплата и доставка ──
    {
      id: 'n_pay_q', type: 'buttons',
      data: {
        label: 'Вопросы об оплате',
        text: '💳 Выберите вопрос:',
        buttons: [
          { label: '💳 Способы оплаты' },
          { label: '🚚 Условия доставки' },
          { label: '↩️ Возврат' },
        ],
      },
      position: { x: 880, y: 500 },
    },
    {
      id: 'n_p1', type: 'message',
      data: {
        label: 'Оплата',
        text: '💳 <b>Способы оплаты</b>\n\n• Наличными при получении\n• Банковская карта\n• Онлайн-перевод\n\n[Добавьте свои способы]',
      },
      position: { x: 720, y: 660 },
    },
    {
      id: 'n_p2', type: 'message',
      data: {
        label: 'Доставка',
        text: '🚚 <b>Доставка</b>\n\n• Самовывоз - бесплатно\n• Курьер по городу - [цена]\n• Транспортная компания - [цена]\n• Срок: [сроки]',
      },
      position: { x: 900, y: 660 },
    },
    {
      id: 'n_p3', type: 'message',
      data: {
        label: 'Возврат',
        text: '↩️ <b>Возврат</b>\n\n[Условия возврата: срок, причины, порядок оформления].',
      },
      position: { x: 1080, y: 660 },
    },

    // ── Контакты ──
    {
      id: 'n_contacts', type: 'message',
      data: {
        label: 'Контакты',
        text: '📞 <b>Контакты</b>\n\nТелефон: [номер]\nEmail: [email]\nСайт: [url]\n\nРежим работы: Пн–Пт 9:00–18:00',
      },
      position: { x: 1200, y: 500 },
    },
  ],

  edges: [
    { id: 'e1-2',   source: 'n1', target: 'n2' },
    { id: 'e2-3',   source: 'n2', target: 'n3' },
    // Меню → разделы
    { id: 'em-aq',  source: 'n3', target: 'n_about_q', sourceHandle: '🏢 О компании' },
    { id: 'em-sq',  source: 'n3', target: 'n_svc_q',   sourceHandle: '🛒 Товары и услуги' },
    { id: 'em-pq',  source: 'n3', target: 'n_pay_q',   sourceHandle: '💳 Оплата и доставка' },
    { id: 'em-cnt', source: 'n3', target: 'n_contacts', sourceHandle: '📞 Контакты' },
    // О компании → ответы
    { id: 'ea-1', source: 'n_about_q', target: 'n_a1', sourceHandle: '❓ Кто вы такие?' },
    { id: 'ea-2', source: 'n_about_q', target: 'n_a2', sourceHandle: '📍 Где находитесь?' },
    { id: 'ea-3', source: 'n_about_q', target: 'n_a3', sourceHandle: '🕐 Режим работы' },
    { id: 'ea1-m', source: 'n_a1', target: 'n3' },
    { id: 'ea2-m', source: 'n_a2', target: 'n3' },
    { id: 'ea3-m', source: 'n_a3', target: 'n3' },
    // Товары → ответы
    { id: 'es-1', source: 'n_svc_q', target: 'n_s1', sourceHandle: '📦 Что вы предлагаете?' },
    { id: 'es-2', source: 'n_svc_q', target: 'n_s2', sourceHandle: '💰 Сколько стоит?' },
    { id: 'es-3', source: 'n_svc_q', target: 'n_s3', sourceHandle: '⭐ Гарантия' },
    { id: 'es1-m', source: 'n_s1', target: 'n3' },
    { id: 'es2-m', source: 'n_s2', target: 'n3' },
    { id: 'es3-m', source: 'n_s3', target: 'n3' },
    // Оплата → ответы
    { id: 'ep-1', source: 'n_pay_q', target: 'n_p1', sourceHandle: '💳 Способы оплаты' },
    { id: 'ep-2', source: 'n_pay_q', target: 'n_p2', sourceHandle: '🚚 Условия доставки' },
    { id: 'ep-3', source: 'n_pay_q', target: 'n_p3', sourceHandle: '↩️ Возврат' },
    { id: 'ep1-m', source: 'n_p1', target: 'n3' },
    { id: 'ep2-m', source: 'n_p2', target: 'n3' },
    { id: 'ep3-m', source: 'n_p3', target: 'n3' },
    // Контакты → меню
    { id: 'ec-m', source: 'n_contacts', target: 'n3' },
  ],
};

// ── Survey / Feedback template ───────────────────────────────────────────────
const SURVEY_FLOW = {
  nodes: [
    { id: 'n1', type: 'start', data: { label: 'Старт' }, position: { x: 300, y: 40 } },
    {
      id: 'n2', type: 'message',
      data: {
        label: 'Введение',
        text: '📊 Спасибо, что пользуетесь нашим сервисом!\n\nПройдите короткий опрос из 5 вопросов - это займёт не более 2 минут.\nВаше мнение помогает нам становиться лучше 🙏',
      },
      position: { x: 300, y: 160 },
    },
    // Вопрос 1 - имя
    {
      id: 'n3', type: 'question',
      data: {
        label: 'Вопрос 1 - Имя',
        text: '👤 Как вас зовут? (можно имя или псевдоним)',
        variableName: 'respondent_name',
        answerType: 'text',
      },
      position: { x: 300, y: 290 },
    },
    // Вопрос 2 - источник
    {
      id: 'n4', type: 'buttons',
      data: {
        label: 'Вопрос 2 - Откуда узнали',
        text: '📣 Как вы о нас узнали?',
        buttons: [
          { label: '📱 Соцсети' },
          { label: '👥 Друзья / знакомые' },
          { label: '🔍 Поиск в интернете' },
          { label: '📺 Реклама' },
        ],
        saveAs: 'source',
      },
      position: { x: 300, y: 410 },
    },
    // Вопрос 3 - оценка
    {
      id: 'n5', type: 'buttons',
      data: {
        label: 'Вопрос 3 - Оценка',
        text: '⭐ Оцените качество нашего сервиса:',
        buttons: [
          { label: '⭐⭐⭐⭐⭐ Отлично' },
          { label: '⭐⭐⭐⭐ Хорошо' },
          { label: '⭐⭐⭐ Нормально' },
          { label: '⭐⭐ Плохо' },
        ],
        saveAs: 'rating',
      },
      position: { x: 300, y: 540 },
    },
    // Вопрос 4 - рекомендация
    {
      id: 'n6', type: 'buttons',
      data: {
        label: 'Вопрос 4 - Рекомендация',
        text: '🤝 Порекомендуете нас друзьям или коллегам?',
        buttons: [
          { label: '👍 Да, конечно!' },
          { label: '🤷 Возможно' },
          { label: '👎 Нет' },
        ],
        saveAs: 'recommend',
      },
      position: { x: 300, y: 670 },
    },
    // Вопрос 5 - комментарий
    {
      id: 'n7', type: 'question',
      data: {
        label: 'Вопрос 5 - Комментарий',
        text: '💬 Есть пожелания или комментарии? (напишите или «нет»)',
        variableName: 'comment',
        answerType: 'text',
      },
      position: { x: 300, y: 800 },
    },
    {
      id: 'n8', type: 'message',
      data: {
        label: 'Благодарность',
        text: '🎉 Спасибо, {{respondent_name}}!\n\nВаши ответы очень важны для нас. Мы обязательно их учтём.',
      },
      position: { x: 300, y: 930 },
    },
    {
      id: 'n9', type: 'notification',
      data: {
        label: 'Уведомление администратору',
        text:
          '📊 <b>Новый ответ на опрос!</b>\n\n' +
          '👤 Имя: {{respondent_name}}\n' +
          '📣 Источник: {{source}}\n' +
          '⭐ Оценка: {{rating}}\n' +
          '🤝 Рекомендует: {{recommend}}\n' +
          '💬 Комментарий: {{comment}}',
      },
      position: { x: 300, y: 1060 },
    },
    { id: 'n10', type: 'end', data: { label: 'Конец' }, position: { x: 300, y: 1180 } },
  ],

  edges: [
    { id: 'e1-2', source: 'n1', target: 'n2' },
    { id: 'e2-3', source: 'n2', target: 'n3' },
    { id: 'e3-4', source: 'n3', target: 'n4' },
    // Откуда узнали → оценка
    { id: 'e4a-5', source: 'n4', target: 'n5', sourceHandle: '📱 Соцсети' },
    { id: 'e4b-5', source: 'n4', target: 'n5', sourceHandle: '👥 Друзья / знакомые' },
    { id: 'e4c-5', source: 'n4', target: 'n5', sourceHandle: '🔍 Поиск в интернете' },
    { id: 'e4d-5', source: 'n4', target: 'n5', sourceHandle: '📺 Реклама' },
    // Оценка → рекомендация
    { id: 'e5a-6', source: 'n5', target: 'n6', sourceHandle: '⭐⭐⭐⭐⭐ Отлично' },
    { id: 'e5b-6', source: 'n5', target: 'n6', sourceHandle: '⭐⭐⭐⭐ Хорошо' },
    { id: 'e5c-6', source: 'n5', target: 'n6', sourceHandle: '⭐⭐⭐ Нормально' },
    { id: 'e5d-6', source: 'n5', target: 'n6', sourceHandle: '⭐⭐ Плохо' },
    // Рекомендация → комментарий
    { id: 'e6a-7', source: 'n6', target: 'n7', sourceHandle: '👍 Да, конечно!' },
    { id: 'e6b-7', source: 'n6', target: 'n7', sourceHandle: '🤷 Возможно' },
    { id: 'e6c-7', source: 'n6', target: 'n7', sourceHandle: '👎 Нет' },
    // Финал
    { id: 'e7-8',  source: 'n7', target: 'n8' },
    { id: 'e8-9',  source: 'n8', target: 'n9' },
    { id: 'e9-10', source: 'n9', target: 'n10' },
  ],
};

// ── Price calculator template ────────────────────────────────────────────────
const CALCULATOR_FLOW = {
  nodes: [
    { id: 'n1', type: 'start', data: { label: 'Старт' }, position: { x: 300, y: 40 } },
    {
      id: 'n2', type: 'message',
      data: {
        label: 'Введение',
        text: '🧮 Рассчитайте стоимость нашей услуги!\n\nОтветьте на 4 вопроса - мы подберём подходящее предложение и перезвоним с точными цифрами.',
      },
      position: { x: 300, y: 160 },
    },
    // Тип услуги
    {
      id: 'n3', type: 'buttons',
      data: {
        label: 'Тип услуги',
        text: '🛠️ Что вам нужно?',
        buttons: [
          { label: '🌐 Сайт или лендинг' },
          { label: '🛒 Интернет-магазин' },
          { label: '📱 Мобильное приложение' },
          { label: '🎨 Дизайн / брендинг' },
        ],
        saveAs: 'service_type',
      },
      position: { x: 300, y: 290 },
    },
    // Масштаб
    {
      id: 'n4', type: 'buttons',
      data: {
        label: 'Масштаб проекта',
        text: '📐 Масштаб проекта:\n\n🟢 Небольшой - до 10 страниц, базовый функционал\n🟡 Средний - 10–30 страниц, стандартный функционал\n🔴 Крупный - 30+ страниц, сложная логика',
        buttons: [
          { label: '🟢 Небольшой' },
          { label: '🟡 Средний' },
          { label: '🔴 Крупный' },
        ],
        saveAs: 'scale',
      },
      position: { x: 300, y: 430 },
    },
    // Бюджет
    {
      id: 'n5', type: 'buttons',
      data: {
        label: 'Бюджет',
        text: '💰 Ориентировочный бюджет:',
        buttons: [
          { label: '💵 до 50 000 руб.' },
          { label: '💵 50 000–200 000 руб.' },
          { label: '💵 от 200 000 руб.' },
          { label: '❓ Не определился' },
        ],
        saveAs: 'budget',
      },
      position: { x: 300, y: 590 },
    },
    // Срок
    {
      id: 'n6', type: 'buttons',
      data: {
        label: 'Срок',
        text: '🗓️ Когда нужен результат?',
        buttons: [
          { label: '⚡ Срочно (до 2 нед.)' },
          { label: '📅 1–2 месяца' },
          { label: '🕐 Не горит' },
        ],
        saveAs: 'deadline',
      },
      position: { x: 300, y: 740 },
    },
    // Контакты
    {
      id: 'n7', type: 'question',
      data: { label: 'Имя', text: '👤 Как вас зовут?', variableName: 'name', answerType: 'text' },
      position: { x: 300, y: 870 },
    },
    {
      id: 'n8', type: 'question',
      data: { label: 'Телефон', text: '📞 Номер телефона для обратного звонка:', variableName: 'phone', answerType: 'text' },
      position: { x: 300, y: 980 },
    },
    // Итог
    {
      id: 'n9', type: 'message',
      data: {
        label: 'Результат расчёта',
        text:
          '📋 <b>Ваш запрос принят!</b>\n\n' +
          '🛠️ Услуга: {{service_type}}\n' +
          '📐 Масштаб: {{scale}}\n' +
          '💰 Бюджет: {{budget}}\n' +
          '🗓️ Срок: {{deadline}}\n\n' +
          'Мы рассчитаем точную стоимость и позвоним вам по номеру {{phone}}.\n\n' +
          'Обычно обратный звонок - в течение 2 часов в рабочее время 🤝',
      },
      position: { x: 300, y: 1100 },
    },
    {
      id: 'n10', type: 'notification',
      data: {
        label: 'Уведомление администратору',
        text:
          '🧮 <b>Новый запрос на расчёт!</b>\n\n' +
          '🛠️ {{service_type}}\n' +
          '📐 {{scale}}\n' +
          '💰 {{budget}}\n' +
          '🗓️ {{deadline}}\n' +
          '👤 {{name}}\n' +
          '📞 {{phone}}',
      },
      position: { x: 300, y: 1230 },
    },
    { id: 'n11', type: 'end', data: { label: 'Конец' }, position: { x: 300, y: 1350 } },
  ],

  edges: [
    { id: 'e1-2', source: 'n1', target: 'n2' },
    { id: 'e2-3', source: 'n2', target: 'n3' },
    // Тип услуги → масштаб
    { id: 'e3a-4', source: 'n3', target: 'n4', sourceHandle: '🌐 Сайт или лендинг' },
    { id: 'e3b-4', source: 'n3', target: 'n4', sourceHandle: '🛒 Интернет-магазин' },
    { id: 'e3c-4', source: 'n3', target: 'n4', sourceHandle: '📱 Мобильное приложение' },
    { id: 'e3d-4', source: 'n3', target: 'n4', sourceHandle: '🎨 Дизайн / брендинг' },
    // Масштаб → бюджет
    { id: 'e4a-5', source: 'n4', target: 'n5', sourceHandle: '🟢 Небольшой' },
    { id: 'e4b-5', source: 'n4', target: 'n5', sourceHandle: '🟡 Средний' },
    { id: 'e4c-5', source: 'n4', target: 'n5', sourceHandle: '🔴 Крупный' },
    // Бюджет → срок
    { id: 'e5a-6', source: 'n5', target: 'n6', sourceHandle: '💵 до 50 000 руб.' },
    { id: 'e5b-6', source: 'n5', target: 'n6', sourceHandle: '💵 50 000–200 000 руб.' },
    { id: 'e5c-6', source: 'n5', target: 'n6', sourceHandle: '💵 от 200 000 руб.' },
    { id: 'e5d-6', source: 'n5', target: 'n6', sourceHandle: '❓ Не определился' },
    // Срок → имя
    { id: 'e6a-7', source: 'n6', target: 'n7', sourceHandle: '⚡ Срочно (до 2 нед.)' },
    { id: 'e6b-7', source: 'n6', target: 'n7', sourceHandle: '📅 1–2 месяца' },
    { id: 'e6c-7', source: 'n6', target: 'n7', sourceHandle: '🕐 Не горит' },
    // Контакты → итог → уведомление → конец
    { id: 'e7-8',   source: 'n7',  target: 'n8' },
    { id: 'e8-9',   source: 'n8',  target: 'n9' },
    { id: 'e9-10',  source: 'n9',  target: 'n10' },
    { id: 'e10-11', source: 'n10', target: 'n11' },
  ],
};

// ── Product order template ───────────────────────────────────────────────────
const ORDER_FLOW = {
  nodes: [
    {
      id: 'n1', type: 'start',
      data: { label: 'Старт' },
      position: { x: 320, y: 40 },
    },
    {
      id: 'n2', type: 'message',
      data: {
        label: 'Приветствие',
        text:
          '👋 Добро пожаловать в наш магазин!\n\n' +
          'Здесь вы можете быстро оформить заказ и получить товар с доставкой.\n\n' +
          'Используйте кнопки меню ниже 👇',
      },
      position: { x: 320, y: 160 },
    },
    {
      id: 'n_menu', type: 'menu',
      data: {
        label: 'Главное меню',
        buttons: [
          { label: '🛍️ Сделать заказ' },
          { label: '📋 Каталог и цены' },
          { label: '❓ Помощь' },
        ],
        saveAs: 'menu_choice',
      },
      position: { x: 320, y: 300 },
    },

    // ── Ветка заказа ──────────────────────────────────────────────────────
    {
      id: 'n3', type: 'buttons',
      data: {
        label: 'Выбор товара',
        text: '🛍️ Выберите товар из каталога:',
        buttons: [
          { label: '📦 Продукт А' },
          { label: '📦 Продукт Б' },
          { label: '📦 Продукт В' },
          { label: '📦 Продукт Г' },
        ],
        saveAs: 'product',
      },
      position: { x: 60, y: 480 },
    },
    {
      id: 'n4', type: 'question',
      data: {
        label: 'Количество',
        text: 'Вы выбрали: *{{product}}*\n\nСколько единиц вы хотите заказать?',
        variableName: 'quantity',
        answerType: 'text',
      },
      position: { x: 60, y: 630 },
    },
    {
      id: 'n5', type: 'question',
      data: {
        label: 'Имя клиента',
        text: '👤 Введите ваше имя:',
        variableName: 'name',
        answerType: 'text',
      },
      position: { x: 60, y: 750 },
    },
    {
      id: 'n6', type: 'question',
      data: {
        label: 'Телефон',
        text: '📞 Введите номер телефона для связи:',
        variableName: 'phone',
        answerType: 'text',
      },
      position: { x: 60, y: 860 },
    },
    {
      id: 'n7', type: 'question',
      data: {
        label: 'Адрес доставки',
        text: '📍 Введите адрес доставки (город, улица, дом, квартира):',
        variableName: 'address',
        answerType: 'text',
      },
      position: { x: 60, y: 970 },
    },
    {
      id: 'n8', type: 'buttons',
      data: {
        label: 'Подтверждение заказа',
        text:
          '📋 <b>Ваш заказ:</b>\n\n' +
          '📦 Товар: {{product}}\n' +
          '📊 Количество: {{quantity}} шт.\n' +
          '👤 Получатель: {{name}}\n' +
          '📞 Телефон: {{phone}}\n' +
          '📍 Адрес: {{address}}\n\n' +
          'Всё верно? Подтвердите заказ:',
        buttons: [
          { label: '✅ Подтвердить заказ' },
          { label: '✏️ Изменить' },
          { label: '❌ Отменить' },
        ],
      },
      position: { x: 60, y: 1090 },
    },
    // ── Ветка подтверждения ──
    {
      id: 'n9', type: 'notification',
      data: {
        label: 'Уведомление администратору',
        text:
          '📦 <b>Новый заказ!</b>\n\n' +
          'Товар: {{product}}\n' +
          'Количество: {{quantity}} шт.\n' +
          'Клиент: {{name}}\n' +
          'Телефон: {{phone}}\n' +
          'Адрес: {{address}}',
      },
      position: { x: -160, y: 1270 },
    },
    {
      id: 'n10', type: 'message',
      data: {
        label: 'Заказ принят',
        text:
          '✅ Ваш заказ принят!\n\n' +
          '📦 {{product}} - {{quantity}} шт.\n' +
          '📍 Доставка: {{address}}\n\n' +
          'Мы свяжемся с вами по номеру {{phone}} для подтверждения.\n\n' +
          'Спасибо, {{name}}! 🎉',
      },
      position: { x: -160, y: 1390 },
    },
    { id: 'n11', type: 'end', data: { label: 'Конец (заказ принят)' }, position: { x: -160, y: 1510 } },

    // ── Ветка изменения (возврат к каталогу) ──
    {
      id: 'n_edit', type: 'message',
      data: {
        label: 'Редактирование заказа',
        text: '✏️ Начнём заново. Выберите товар:',
      },
      position: { x: 60, y: 1270 },
    },

    // ── Ветка отмены ──
    {
      id: 'n12', type: 'message',
      data: {
        label: 'Заказ отменён',
        text: '❌ Заказ отменён.\n\nНажмите «🛍️ Сделать заказ» чтобы начать заново.',
      },
      position: { x: 280, y: 1270 },
    },
    { id: 'n13', type: 'end', data: { label: 'Конец (отмена)' }, position: { x: 280, y: 1390 } },

    // ── Ветка «Каталог и цены» ──
    {
      id: 'n14', type: 'message',
      data: {
        label: 'Каталог и цены',
        text:
          '📋 <b>Наш каталог:</b>\n\n' +
          '📦 Продукт А - описание и цена\n' +
          '📦 Продукт Б - описание и цена\n' +
          '📦 Продукт В - описание и цена\n' +
          '📦 Продукт Г - описание и цена\n\n' +
          'Для заказа нажмите «🛍️ Сделать заказ».',
      },
      position: { x: 560, y: 480 },
    },

    // ── Ветка «Помощь» ──
    {
      id: 'n15', type: 'message',
      data: {
        label: 'Помощь',
        text:
          '❓ <b>Помощь</b>\n\n' +
          '• Нажмите «🛍️ Сделать заказ» для оформления\n' +
          '• Выберите нужный товар из каталога\n' +
          '• Укажите количество, имя, телефон и адрес\n' +
          '• Подтвердите - мы свяжемся с вами!\n\n' +
          'По вопросам обращайтесь к администратору.\n' +
          'Для перезапуска - /start',
      },
      position: { x: 820, y: 480 },
    },
  ],

  edges: [
    { id: 'e1-2',   source: 'n1',     target: 'n2' },
    { id: 'e2-m',   source: 'n2',     target: 'n_menu' },

    // Меню → ветки
    { id: 'em-3',   source: 'n_menu', target: 'n3',  sourceHandle: '🛍️ Сделать заказ' },
    { id: 'em-14',  source: 'n_menu', target: 'n14', sourceHandle: '📋 Каталог и цены' },
    { id: 'em-15',  source: 'n_menu', target: 'n15', sourceHandle: '❓ Помощь' },

    // Каталог - все товары ведут к вопросу о количестве
    { id: 'e3a-4',  source: 'n3', target: 'n4', sourceHandle: '📦 Продукт А' },
    { id: 'e3b-4',  source: 'n3', target: 'n4', sourceHandle: '📦 Продукт Б' },
    { id: 'e3c-4',  source: 'n3', target: 'n4', sourceHandle: '📦 Продукт В' },
    { id: 'e3d-4',  source: 'n3', target: 'n4', sourceHandle: '📦 Продукт Г' },

    // Сбор данных
    { id: 'e4-5',   source: 'n4', target: 'n5' },
    { id: 'e5-6',   source: 'n5', target: 'n6' },
    { id: 'e6-7',   source: 'n6', target: 'n7' },
    { id: 'e7-8',   source: 'n7', target: 'n8' },

    // Подтверждение
    { id: 'e8-9',     source: 'n8', target: 'n9',     sourceHandle: '✅ Подтвердить заказ' },
    { id: 'e8-edit',  source: 'n8', target: 'n_edit', sourceHandle: '✏️ Изменить' },
    { id: 'e8-12',    source: 'n8', target: 'n12',    sourceHandle: '❌ Отменить' },

    // Успех
    { id: 'e9-10',  source: 'n9',     target: 'n10' },
    { id: 'e10-11', source: 'n10',    target: 'n11' },

    // Редактирование → обратно к каталогу
    { id: 'eedit-3', source: 'n_edit', target: 'n3' },

    // Отмена
    { id: 'e12-13', source: 'n12', target: 'n13' },

    // Информационные ветки - возврат в меню
    { id: 'e14-m',  source: 'n14', target: 'n_menu' },
    { id: 'e15-m',  source: 'n15', target: 'n_menu' },
  ],
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/botconstructor');

  await Template.findOneAndUpdate(
    { name: 'FAQ / База знаний' },
    {
      name: 'FAQ / База знаний',
      description: 'Бот-справочник: 4 категории с вопросами и ответами, постоянное меню. Идеально для службы поддержки.',
      flow: FAQ_FLOW,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ FAQ template seeded.');

  await Template.findOneAndUpdate(
    { name: 'Опрос / Анкета' },
    {
      name: 'Опрос / Анкета',
      description: 'Сбор обратной связи: 5 вопросов (текст + кнопки), итоговое уведомление администратору со всеми ответами.',
      flow: SURVEY_FLOW,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Survey template seeded.');

  await Template.findOneAndUpdate(
    { name: 'Калькулятор стоимости' },
    {
      name: 'Калькулятор стоимости',
      description: 'Пре-квалификация клиентов: тип услуги, масштаб, бюджет, срок → контакты → уведомление с готовым брифом.',
      flow: CALCULATOR_FLOW,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Calculator template seeded.');

  await Template.findOneAndUpdate(
    { name: 'Запись и бронирование' },
    {
      name: 'Запись и бронирование',
      description: 'Шаблон для записи клиентов: главное меню, выбор услуги, даты, времени и имени с подтверждением.',
      flow: BOOKING_FLOW,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Booking template seeded.');

  await Template.findOneAndUpdate(
    { name: 'Заявки с сайта' },
    {
      name: 'Заявки с сайта',
      description: 'Бот-приёмник форм обратной связи: получает заявки через Webhook и мгновенно уведомляет администратора в Telegram.',
      flow: LEAD_FLOW,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Lead capture template seeded.');

  await Template.findOneAndUpdate(
    { name: 'Заказ продукции' },
    {
      name: 'Заказ продукции',
      description: 'Шаблон для интернет-магазина: выбор товара из каталога, ввод количества и контактных данных, подтверждение заказа с уведомлением администратора.',
      flow: ORDER_FLOW,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Order template seeded.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
