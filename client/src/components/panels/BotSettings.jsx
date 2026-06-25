import { useState } from 'react';
import { clearBotToken } from '../../api/bots';
import VideoModal from '../VideoModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const TOKEN_VIDEO = '/botconstructor/token_guide.MP4';
const ADMIN_VIDEO = '/botconstructor/admin_id_guide.MP4';
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const SLOT_OPTIONS = [
  { value: 30,  label: '30 минут' },
  { value: 60,  label: '1 час' },
  { value: 90,  label: '1.5 часа' },
  { value: 120, label: '2 часа' },
];

export default function BotSettings({ bot, onSave, onClearToken, onClose }) {
  const webhookUrl = `${API_BASE}/webhook/${bot._id}`;

  const defaultSchedule = {
    enabled: false, workDays: [1, 2, 3, 4, 5],
    workStart: '09:00', workEnd: '18:00', slotDuration: 60,
  };
  const initSched = bot.schedule ? { ...defaultSchedule, ...bot.schedule } : defaultSchedule;

  const [form, setForm] = useState({
    name: bot.name || '',
    token: '',
    adminChatId: bot.adminChatId || '',
    timezone: bot.timezone || 'UTC',
  });
  const [sched, setSched] = useState(initSched);
  const [hasToken, setHasToken] = useState(bot.hasToken);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showAdminVideo, setShowAdminVideo] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, schedule: sched });
    if (form.token) setHasToken(true);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearToken() {
    if (!confirm('Отвязать токен? Бот будет остановлен.')) return;
    setClearing(true);
    try {
      await clearBotToken(bot._id);
      setHasToken(false);
      setForm((f) => ({ ...f, token: '' }));
      if (onClearToken) onClearToken();
    } finally {
      setClearing(false);
    }
  }

  function toggleDay(idx) {
    const days = sched.workDays.includes(idx)
      ? sched.workDays.filter((d) => d !== idx)
      : [...sched.workDays, idx].sort((a, b) => a - b);
    setSched({ ...sched, workDays: days });
  }

  return (
    <>
    {showVideo && (
      <VideoModal src={TOKEN_VIDEO} title="Как получить Telegram Bot Token" onClose={() => setShowVideo(false)} />
    )}
    {showAdminVideo && (
      <VideoModal src={ADMIN_VIDEO} title="Как узнать свой Telegram ID" onClose={() => setShowAdminVideo(false)} />
    )}
    <div className="node-editor">
      <div className="node-editor-header">
        <h3>Настройки бота</h3>
        <button onClick={onClose}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <label>Название</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 4px' }}>
          <label style={{ margin: 0 }}>Telegram Bot Token</label>
          <button type="button" className="guide-help-btn" title="Видео: как получить токен" onClick={() => setShowVideo(true)}>?</button>
        </div>
        <input
          type="password"
          value={form.token}
          onChange={(e) => setForm({ ...form, token: e.target.value })}
          placeholder={hasToken ? '●●●●●●●● (токен задан)' : 'Вставьте токен от @BotFather'}
        />
        {hasToken ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span className="hint" style={{ margin: 0 }}>Токен привязан</span>
            <button type="button" className="btn-danger btn-sm" onClick={handleClearToken} disabled={clearing}>
              {clearing ? '...' : 'Отвязать'}
            </button>
          </div>
        ) : (
          <p className="hint">Токен не задан — бот не может быть запущен</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 4px' }}>
          <label style={{ margin: 0 }}>Telegram ID администратора</label>
          <button type="button" className="guide-help-btn" title="Видео: как узнать свой ID" onClick={() => setShowAdminVideo(true)}>?</button>
        </div>
        <input value={form.adminChatId} onChange={(e) => setForm({ ...form, adminChatId: e.target.value })} placeholder="123456789" />
        <p className="hint">Для блока «Уведомление»</p>

        <label>Часовой пояс</label>
        <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
          <option value="UTC">UTC</option>
          <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
          <option value="Europe/Kiev">Europe/Kiev (UTC+2/3)</option>
          <option value="Asia/Almaty">Asia/Almaty (UTC+5/6)</option>
          <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
        </select>

        {/* ── Schedule section ─────────────────────────────────────────────── */}
        <div className="settings-divider" />
        <div className="settings-section-title">Расписание бронирования</div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={sched.enabled}
            onChange={(e) => setSched({ ...sched, enabled: e.target.checked })}
          />
          Включить систему бронирования
        </label>

        {sched.enabled && (
          <>
            <label>Рабочие дни</label>
            <div className="workdays-row">
              {DAY_LABELS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={'workday-btn' + (sched.workDays.includes(i) ? ' active' : '')}
                  onClick={() => toggleDay(i)}
                >
                  {d}
                </button>
              ))}
            </div>

            <label>Часы работы</label>
            <div className="time-range-row">
              <input
                type="time"
                value={sched.workStart}
                onChange={(e) => setSched({ ...sched, workStart: e.target.value })}
              />
              <span>—</span>
              <input
                type="time"
                value={sched.workEnd}
                onChange={(e) => setSched({ ...sched, workEnd: e.target.value })}
              />
            </div>

            <label>Длительность слота</label>
            <select
              value={sched.slotDuration}
              onChange={(e) => setSched({ ...sched, slotDuration: Number(e.target.value) })}
            >
              {SLOT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="hint">
              Клиенты не смогут записаться на уже занятый слот. Пикер времени автоматически скроет недоступные часы.
            </p>
          </>
        )}

        {/* ── Webhook URL ──────────────────────────────────────────────────── */}
        <div className="settings-divider" />
        <div className="settings-section-title">Webhook для форм с сайта</div>
        <p className="hint" style={{ marginBottom: 6 }}>
          Вставьте этот URL в форму обратной связи на вашем сайте. Каждая отправка придёт в Telegram администратору.
        </p>
        <div className="webhook-url-row">
          <input readOnly value={webhookUrl} className="webhook-url-input" onClick={(e) => e.target.select()} />
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => { navigator.clipboard.writeText(webhookUrl); }}
            title="Скопировать"
          >
            📋
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 12 }}>
          {saving ? 'Сохраняем...' : saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </form>
    </div>
    </>
  );
}
