import { useEffect } from 'react';

const BASE = '/botconstructor';

export const NODE_PREVIEWS = {
  start:        { img: `${BASE}/start_guide.jpg`,              title: 'Старт',          desc: 'Бот реагирует на команду /start - с этого начинается любой сценарий.' },
  message:      { img: `${BASE}/confirmed_guide.jpg`,          title: 'Сообщение',      desc: 'Бот отправляет текстовое сообщение клиенту. Поддерживает {{переменные}}.' },
  buttons:      { img: `${BASE}/choice_guide.png`,             title: 'Кнопки',         desc: 'Инлайн-кнопки прикреплены к сообщению - клиент выбирает один из вариантов, кнопки исчезают после нажатия.' },
  menu:         { img: `${BASE}/main_menu_guide.jpg`,             title: 'Главное меню',   desc: 'Постоянная клавиатура внизу чата - остаётся видимой в любой момент разговора.' },
  question:     { img: `${BASE}/questions_guide.jpg`,          title: 'Вопрос',         desc: 'Бот задаёт вопрос и ждёт текстового ответа. Ответ сохраняется в переменную.' },
  notification: { img: `${BASE}/admin_notification_guide.jpg`, title: 'Уведомление',    desc: 'Сообщение отправляется администратору бота (adminChatId в настройках).' },
};

export const PREVIEW_WALK = ['start', 'message', 'buttons', 'menu', 'question', 'notification'];

export default function NodePreview({ type, walkIdx, walkTotal, onNext, onPrev, onClose }) {
  const preview = NODE_PREVIEWS[type];

  // Highlight the matching palette item
  useEffect(() => {
    const el = document.querySelector(`[data-palette="${type}"]`);
    if (!el) return;
    el.classList.add('guide-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return () => el.classList.remove('guide-highlight');
  }, [type]);

  if (!preview) return null;

  const isWalk = walkIdx !== null && walkTotal > 0;

  return (
    <>
      <div className="guide-overlay" onClick={onClose} style={{ pointerEvents: 'all', cursor: 'default' }} />
      <div className="node-preview-modal">
        <button className="node-preview-close btn-icon" onClick={onClose}>✕</button>

        {isWalk && (
          <div className="node-preview-step">{walkIdx + 1} / {walkTotal}</div>
        )}

        <div className="node-preview-title">{preview.title}</div>

        <img
          src={preview.img}
          alt={preview.title}
          className="node-preview-img"
        />

        <p className="node-preview-desc">{preview.desc}</p>

        {isWalk ? (
          <div className="node-preview-nav">
            <button className="btn-outline btn-sm" disabled={walkIdx === 0} onClick={onPrev}>← Назад</button>
            <button className="btn-primary btn-sm" onClick={onNext}>
              {walkIdx === walkTotal - 1 ? 'Готово' : 'Далее →'}
            </button>
          </div>
        ) : (
          <div className="node-preview-nav">
            <button className="btn-primary btn-sm" onClick={onClose}>Закрыть</button>
          </div>
        )}
      </div>
    </>
  );
}
