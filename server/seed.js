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
          '📌 Ваш персональный Webhook URL — в настройках бота (кнопка ⚙️ вверху).\n\n' +
          'Вставьте его в форму обратной связи — и заявки будут приходить прямо сюда.',
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
          '📋 Новые заявки приходят автоматически — вы получите уведомление сразу после того, как кто-то отправит форму на вашем сайте.\n\n' +
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
          '2️⃣ <b>HTML-форма</b> — укажите URL в action:\n' +
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
          '✅ Поддерживаются любые поля — бот покажет все, что вы передадите.',
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
          '• <b>Уведомления не приходят</b> — проверьте, что Telegram ID администратора указан в настройках и бот запущен.\n\n' +
          '• <b>Форма не отправляется</b> — убедитесь, что Webhook URL скопирован полностью и форма отправляет POST-запрос.\n\n' +
          '• <b>Нужны другие поля</b> — добавьте их с любым именем, бот покажет все переданные данные.\n\n' +
          '• <b>CORS-ошибка</b> — сервер принимает запросы с любого домена, проверьте правильность URL.\n\n' +
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

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/botconstructor');

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

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
