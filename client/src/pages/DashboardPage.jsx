import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBots, createBot, deleteBot, startBot, stopBot } from '../api/bots';
import { getTemplates } from '../api/templates';
import { useAuth } from '../context/AuthContext';
import Guide, { buildSteps } from '../components/Guide';

const STATUS_LABELS = {
  active: { label: 'Активен', cls: 'status-active' },
  stopped: { label: 'Остановлен', cls: 'status-stopped' },
  error: { label: 'Ошибка', cls: 'status-error' },
};

const GUIDE_STEPS = buildSteps('dashboard');
const GUIDE_KEY = 'guide_dashboard_done';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [guideStep, setGuideStep] = useState(() => localStorage.getItem(GUIDE_KEY) ? -1 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBots();
    getTemplates().then(setTemplates).catch(console.error);
  }, []);

  async function loadBots() {
    try {
      const data = await getBots();
      setBots(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newBotName.trim()) return;
    setLoading(true);
    setError('');
    try {
      let nodes = [];
      let edges = [];
      let templateId;

      if (selectedTemplate) {
        const tpl = templates.find((t) => t._id === selectedTemplate);
        if (tpl?.flow) {
          nodes = tpl.flow.nodes || [];
          edges = tpl.flow.edges || [];
        }
        templateId = selectedTemplate;
      }

      const bot = await createBot({ name: newBotName.trim(), templateId, nodes, edges });
      setBots((prev) => [...prev, bot]);
      setShowCreate(false);
      setNewBotName('');
      setSelectedTemplate('');
      navigate(`/editor/${bot._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания бота');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить бота?')) return;
    await deleteBot(id);
    setBots((prev) => prev.filter((b) => b._id !== id));
  }

  async function handleToggle(bot) {
    try {
      if (bot.status === 'active') {
        const res = await stopBot(bot._id);
        setBots((prev) => prev.map((b) => (b._id === bot._id ? { ...b, status: res.status } : b)));
      } else {
        const res = await startBot(bot._id);
        setBots((prev) => prev.map((b) => (b._id === bot._id ? { ...b, status: res.status } : b)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  }

  function finishGuide() {
    localStorage.setItem(GUIDE_KEY, '1');
    setGuideStep(-1);
  }

  return (
    <div className="dashboard">
      {guideStep >= 0 && (
        <Guide
          steps={GUIDE_STEPS}
          stepIndex={guideStep}
          onNext={() => guideStep < GUIDE_STEPS.length - 1 ? setGuideStep(guideStep + 1) : finishGuide()}
          onSkip={finishGuide}
        />
      )}

      <header className="dashboard-header">
        <h1>BotConstructor</h1>
        <div className="header-right">
          <span>{user?.email}</span>
          <button className="guide-help-btn" title="Запустить обучение" onClick={() => setGuideStep(0)}>?</button>
          <button className="btn-outline" onClick={logout}>Выйти</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-row">
          <h2>Мои боты</h2>
          <button className="btn-primary" data-guide="create-btn" onClick={() => setShowCreate(true)}>
            + Создать бота
          </button>
        </div>

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Новый бот</h3>
              <form onSubmit={handleCreate}>
                <input
                  placeholder="Название бота"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  required
                  autoFocus
                />
                <label>Шаблон (необязательно)</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value="">Пустой бот</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {error && <p className="error">{error}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Создаём...' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {bots.length === 0 ? (
          <div className="empty-state">
            <p>У вас ещё нет ботов.</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              Создать первого бота
            </button>
          </div>
        ) : (
          <div className="bot-grid" data-guide="bot-grid">
            {bots.map((bot) => {
              const st = STATUS_LABELS[bot.status] || STATUS_LABELS.stopped;
              return (
                <div className="bot-card" key={bot._id}>
                  <div className="bot-card-header">
                    <h3>{bot.name}</h3>
                    <span className={`status-badge ${st.cls}`}>{st.label}</span>
                  </div>
                  {!bot.hasToken && (
                    <p className="warn-token">Токен не задан - бота нельзя запустить</p>
                  )}
                  <div className="bot-card-actions">
                    <button
                      className="btn-outline"
                      onClick={() => navigate(`/editor/${bot._id}`)}
                    >
                      Редактор
                    </button>
                    <button
                      className={bot.status === 'active' ? 'btn-danger' : 'btn-success'}
                      onClick={() => handleToggle(bot)}
                      disabled={!bot.hasToken && bot.status !== 'active'}
                    >
                      {bot.status === 'active' ? 'Остановить' : 'Запустить'}
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(bot._id)} title="Удалить">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
