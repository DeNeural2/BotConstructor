import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function buildSteps(page) {
  if (page === 'dashboard') {
    return [
      {
        title: 'Добро пожаловать в BotConstructor!',
        text: 'Это платформа для создания Telegram-ботов без программирования. За несколько минут вы создадите своего первого бота. Давайте разберёмся вместе.',
        target: null,
      },
      {
        title: 'Создайте первого бота',
        text: 'Нажмите «+ Создать бота» чтобы начать. Вы можете создать пустого бота или выбрать готовый шаблон - например, «Запись и бронирование».',
        target: '[data-guide="create-btn"]',
      },
      {
        title: 'Список ботов',
        text: 'Здесь отображаются все ваши боты и их статус: Активен, Остановлен или Ошибка.',
        target: '[data-guide="bot-grid"]',
      },
      {
        title: 'Управление ботом',
        text: '«Редактор» открывает визуальный конструктор. Кнопки «Запустить» / «Остановить» управляют ботом в реальном времени.',
        target: '[data-guide="bot-grid"]',
      },
    ];
  }

  if (page === 'editor') {
    return [
      {
        title: 'Визуальный редактор',
        text: 'Здесь строится логика бота. Перетаскивайте блоки на холст и соединяйте их стрелками - каждое соединение = шаг сценария.',
        target: null,
      },
      {
        title: 'Панель блоков',
        text: 'Кликните на любой тип блока чтобы добавить его на холст. «Сообщение» - бот что-то пишет, «Кнопки» - показывает варианты, «Вопрос» - ждёт ответа.',
        target: '[data-guide="palette"]',
      },
      {
        title: 'Как соединять блоки',
        text: 'Наведите на блок - появятся точки соединения. Тяните от точки к другому блоку. У блока «Кнопки» у каждой кнопки своя точка → разные ветки сценария.',
        target: '[data-guide="canvas"]',
      },
      {
        title: 'Настройки бота и токен',
        text: 'Нажмите «Настройки» чтобы задать Telegram Bot Token. Без токена бота нельзя запустить.',
        target: '[data-guide="settings-btn"]',
      },
      {
        title: 'Как получить токен',
        text: '1. Откройте Telegram и найдите @BotFather\n2. Отправьте /newbot\n3. Задайте имя и username бота\n4. BotFather выдаст токен вида 123456:ABC-...\n5. Скопируйте его в поле «Telegram Bot Token»',
        target: '[data-guide="settings-btn"]',
      },
      {
        title: 'Запуск бота',
        text: 'После настройки нажмите «Сохранить», затем «Запустить». Статус изменится на «Активен» - ваш бот работает!',
        target: '[data-guide="run-btn"]',
      },
      {
        title: 'Копирование и удаление блоков',
        text: 'Ctrl+C / Ctrl+V - копировать/вставить блок. Правая кнопка мыши по блоку - удалить. Или перетащите блок в корзину, которая появится внизу экрана.',
        target: null,
      },
    ];
  }

  return [];
}

const MARGIN = 16;

export default function Guide({ steps, stepIndex, onNext, onSkip }) {
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const tooltipRef = useRef(null);
  const [style, setStyle] = useState({ position: 'fixed', visibility: 'hidden', top: 0, left: 0 });

  // Re-position whenever the step changes
  useLayoutEffect(() => {
    if (!tooltipRef.current || !step) return;

    const tt = tooltipRef.current.getBoundingClientRect();
    const targetEl = step.target ? document.querySelector(step.target) : null;

    if (!targetEl) {
      setStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        visibility: 'visible',
      });
      return;
    }

    const rect = targetEl.getBoundingClientRect();

    // Horizontal: align to target left, clamp so tooltip stays on screen
    let left = rect.left;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - tt.width - MARGIN));

    // Vertical: try below, then above, then center
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    let top;

    if (spaceBelow >= tt.height) {
      top = rect.bottom + MARGIN;
    } else if (spaceAbove >= tt.height) {
      top = rect.top - tt.height - MARGIN;
    } else {
      // Not enough room either side - center vertically
      top = Math.max(MARGIN, (window.innerHeight - tt.height) / 2);
    }

    // Hard clamp: never overflow viewport
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - tt.height - MARGIN));

    setStyle({ position: 'fixed', top, left, visibility: 'visible' });
  }, [stepIndex, step?.target]);

  // Highlight target element
  useEffect(() => {
    if (!step?.target) return;
    const el = document.querySelector(step.target);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('guide-highlight');
    return () => el.classList.remove('guide-highlight');
  }, [stepIndex, step?.target]);

  function handleSkip() {
    document.querySelectorAll('.guide-highlight').forEach((el) => el.classList.remove('guide-highlight'));
    onSkip();
  }

  if (!step) return null;

  return (
    <>
      <div className="guide-overlay" />
      <div ref={tooltipRef} className="guide-tooltip" style={style}>
        <div className="guide-step-count">{stepIndex + 1} / {steps.length}</div>
        <h3 className="guide-title">{step.title}</h3>
        <p className="guide-text" style={{ whiteSpace: 'pre-line' }}>{step.text}</p>
        <div className="guide-actions">
          <button className="btn-outline btn-sm" onClick={handleSkip}>Пропустить</button>
          <button className="btn-primary btn-sm" onClick={onNext}>
            {isLast ? 'Готово' : 'Далее →'}
          </button>
        </div>
      </div>
    </>
  );
}
