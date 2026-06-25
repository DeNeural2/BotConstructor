import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getBot, updateBot, startBot, stopBot } from '../api/bots';
import Guide, { buildSteps } from '../components/Guide';
import NodePreview, { NODE_PREVIEWS, PREVIEW_WALK } from '../components/NodePreview';
import VideoModal from '../components/VideoModal';
import StartNode from '../components/nodes/StartNode';
import MessageNode from '../components/nodes/MessageNode';
import ButtonsNode from '../components/nodes/ButtonsNode';
import QuestionNode from '../components/nodes/QuestionNode';
import ConditionNode from '../components/nodes/ConditionNode';
import MultiConditionNode from '../components/nodes/MultiConditionNode';
import MenuNode from '../components/nodes/MenuNode';
import SaveDataNode from '../components/nodes/SaveDataNode';
import NotificationNode from '../components/nodes/NotificationNode';
import EndNode from '../components/nodes/EndNode';
import BookingNode from '../components/nodes/BookingNode';
import NodeEditor from '../components/panels/NodeEditor';
import BotSettings from '../components/panels/BotSettings';

const TOKEN_VIDEO = '/botconstructor/token_guide.MP4';

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  buttons: ButtonsNode,
  question: QuestionNode,
  condition: ConditionNode,
  multiCondition: MultiConditionNode,
  menu: MenuNode,
  saveData: SaveDataNode,
  booking: BookingNode,
  notification: NotificationNode,
  end: EndNode,
};

const TYPE_LABELS = {
  start: 'Старт', message: 'Сообщение', buttons: 'Кнопки',
  question: 'Вопрос', condition: 'Условие', multiCondition: 'Мульти-условие',
  menu: 'Главное меню', saveData: 'Сохранить данные', booking: 'Бронь', notification: 'Уведомление', end: 'Конец',
};

const PALETTE = [
  { type: 'message', label: 'Сообщение' },
  { type: 'buttons', label: 'Кнопки (к сообщению)' },
  { type: 'menu', label: 'Главное меню' },
  { type: 'question', label: 'Вопрос' },
  { type: 'condition', label: 'Условие' },
  { type: 'multiCondition', label: 'Мульти-условие' },
  { type: 'saveData', label: 'Сохранить данные' },
  { type: 'booking', label: 'Зафиксировать бронь' },
  { type: 'notification', label: 'Уведомление' },
  { type: 'end', label: 'Конец' },
];

let _idCounter = 1000;
function newId() {
  return `node_${Date.now()}_${_idCounter++}`;
}

function defaultData(type) {
  const base = { label: '' };
  if (type === 'message') return { ...base, text: 'Привет! Напишите ваше сообщение.' };
  if (type === 'buttons') return { ...base, text: 'Выберите вариант:', buttons: [{ label: 'Вариант 1' }] };
  if (type === 'question') return { ...base, text: 'Введите ответ:', variableName: 'answer' };
  if (type === 'condition') return { ...base, variableName: '', condition: 'equals', value: '' };
  if (type === 'saveData') return { ...base, variableName: '', value: '' };
  if (type === 'notification') return { ...base, text: 'Новое уведомление: {{name}}' };
  if (type === 'menu') return { ...base, buttons: [{ label: 'Пункт 1' }, { label: 'Пункт 2' }] };
  if (type === 'booking') return { ...base, dateVar: 'date', timeVar: 'time' };
  if (type === 'multiCondition') return {
    ...base,
    conditions: [
      { id: `c${Date.now()}0`, variableName: '', condition: 'equals', value: '' },
      { id: `c${Date.now()}1`, variableName: '', condition: 'equals', value: '' },
    ],
  };
  return base;
}

function EditorInner() {
  const { id: botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Right-panel state — only one active at a time
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Drag-to-trash state
  const [isDragging, setIsDragging] = useState(false);
  const [trashHover, setTrashHover] = useState(false);
  const trashRef = useRef(null);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState(null); // { nodeId, x, y }

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('stopped');
  const [showTokenVideo, setShowTokenVideo] = useState(false);
  const [error, setError] = useState('');
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const EDITOR_GUIDE_KEY = 'guide_editor_done';
  const EDITOR_GUIDE_STEPS = buildSteps('editor');
  const [guideStep, setGuideStep] = useState(() => localStorage.getItem(EDITOR_GUIDE_KEY) ? -1 : 0);
  function finishEditorGuide() { localStorage.setItem(EDITOR_GUIDE_KEY, '1'); setGuideStep(-1); }

  // ── Node preview walkthrough ─────────────────────────────────────────────
  const PREVIEW_KEY = 'preview_nodes_done';
  const [nodePreview, setNodePreview] = useState(() => {
    if (localStorage.getItem(PREVIEW_KEY)) return null;
    if (!localStorage.getItem(EDITOR_GUIDE_KEY)) return null; // let guide run first
    return { type: PREVIEW_WALK[0], walkIdx: 0 };
  });

  function nextPreview() {
    setNodePreview((prev) => {
      if (!prev || prev.walkIdx === null) return null;
      const next = prev.walkIdx + 1;
      if (next >= PREVIEW_WALK.length) {
        localStorage.setItem(PREVIEW_KEY, '1');
        return null;
      }
      return { type: PREVIEW_WALK[next], walkIdx: next };
    });
  }

  function prevPreview() {
    setNodePreview((prev) => {
      if (!prev || prev.walkIdx === null || prev.walkIdx === 0) return prev;
      const idx = prev.walkIdx - 1;
      return { type: PREVIEW_WALK[idx], walkIdx: idx };
    });
  }

  function closePreview() {
    if (nodePreview?.walkIdx !== null) localStorage.setItem(PREVIEW_KEY, '1');
    setNodePreview(null);
  }

  function openSinglePreview(type, e) {
    e.stopPropagation();
    setNodePreview({ type, walkIdx: null });
  }

  useEffect(() => {
    getBot(botId).then((b) => {
      setBot(b);
      setStatus(b.status);
      setNodes((b.nodes || []).map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })));
      setEdges((b.edges || []).map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null })));
    });
  }, [botId]);

  // ── Connections ──────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ── Node selection ───────────────────────────────────────────────────────
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setShowSettings(false);
    setContextMenu(null);
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
  }, [setEdges]);

  // ── Edge selection ───────────────────────────────────────────────────────
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
    setShowSettings(false);
    setContextMenu(null);
    setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edge.id })));
  }, [setEdges]);

  // ── Pane click — deselect everything ────────────────────────────────────
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null);
    setEdges((eds) => eds.some((e) => e.selected) ? eds.map((e) => ({ ...e, selected: false })) : eds);
  }, [setEdges]);

  // ── Right-click context menu ─────────────────────────────────────────────
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    setSelectedEdge(null);
  }, []);

  // ── Drag-to-trash ────────────────────────────────────────────────────────
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
    setTrashHover(false);
    setContextMenu(null);
  }, []);

  const onNodeDragStop = useCallback((event, node) => {
    setIsDragging(false);
    setTrashHover(false);
    if (!trashRef.current) return;
    const { left, right, top, bottom } = trashRef.current.getBoundingClientRect();
    if (event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom) {
      removeNode(node.id);
    }
  }, []); // removeNode is stable (defined below with setNodes/setEdges)

  // During drag — check if cursor is over trash to highlight it
  const onNodeDrag = useCallback((event) => {
    if (!trashRef.current) return;
    const { left, right, top, bottom } = trashRef.current.getBoundingClientRect();
    const over = event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
    setTrashHover((prev) => prev !== over ? over : prev);
  }, []);

  // ── Delete helpers ───────────────────────────────────────────────────────
  function removeNode(nodeId) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
    setContextMenu(null);
  }

  function removeEdge(edgeId) {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
  }

  // ── Node data change ─────────────────────────────────────────────────────
  function handleNodeDataChange(nodeId, newData) {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n)));
    if (selectedNode?.id === nodeId) setSelectedNode((prev) => ({ ...prev, data: newData }));
  }

  // ── Add node from palette ────────────────────────────────────────────────
  function addNode(type) {
    const position = reactFlowInstance
      ? reactFlowInstance.project({ x: 300, y: 200 })
      : { x: 300, y: 200 };
    setNodes((nds) => [...nds, { id: newId(), type, position, data: defaultData(type) }]);
  }

  // ── Save / Start / Stop ──────────────────────────────────────────────────
  async function handleSave() {
    if (!bot.hasToken) {
      setShowTokenVideo(true);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const serializedNodes = nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data }));
      const serializedEdges = edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null }));
      await updateBot(botId, { nodes: serializedNodes, edges: serializedEdges });
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setError('');
    if (status !== 'active' && !bot.hasToken) {
      setShowTokenVideo(true);
      return;
    }
    try {
      if (status === 'active') {
        const res = await stopBot(botId);
        setStatus(res.status);
      } else {
        await handleSaveInternal();
        const res = await startBot(botId);
        setStatus(res.status);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка');
      setStatus('error');
    }
  }

  // Internal save without token check — used by handleToggle after token is confirmed present
  async function handleSaveInternal() {
    setSaving(true);
    setError('');
    try {
      const serializedNodes = nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data }));
      const serializedEdges = edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null }));
      await updateBot(botId, { nodes: serializedNodes, edges: serializedEdges });
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleSettingsSave(form) {
    const patch = { name: form.name, adminChatId: form.adminChatId, timezone: form.timezone };
    if (form.token) patch.token = form.token;
    if (form.schedule !== undefined) patch.schedule = form.schedule;
    const updated = await updateBot(botId, patch);
    setBot(updated);
  }

  function handleTokenCleared() {
    setBot((prev) => ({ ...prev, hasToken: false, status: 'stopped' }));
    setStatus('stopped');
  }

  // ── Copy / Paste ─────────────────────────────────────────────────────────
  const clipboardRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Prefer React Flow multi-select, fall back to side-panel selection
        const rfSelected = nodes.filter((n) => n.selected);
        const toCopy = rfSelected.length > 0 ? rfSelected : selectedNode ? [{ ...selectedNode }] : [];
        if (toCopy.length === 0) return;
        const ids = new Set(toCopy.map((n) => n.id));
        clipboardRef.current = {
          nodes: toCopy,
          edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
        };
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (!clipboardRef.current) return;
        const { nodes: cNodes, edges: cEdges } = clipboardRef.current;
        const idMap = {};
        const OFFSET = 40;
        const pasted = cNodes.map((n) => {
          const nid = newId();
          idMap[n.id] = nid;
          return { ...n, id: nid, selected: false, position: { x: n.position.x + OFFSET, y: n.position.y + OFFSET } };
        });
        const pastedEdges = cEdges.map((e) => ({
          ...e,
          id: `${e.id}_copy_${Date.now()}`,
          source: idMap[e.source] ?? e.source,
          target: idMap[e.target] ?? e.target,
        }));
        setNodes((nds) => [...nds, ...pasted]);
        setEdges((eds) => [...eds, ...pastedEdges]);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nodes, edges, selectedNode, setNodes, setEdges]);

  // ── Edge info helpers ────────────────────────────────────────────────────
  function nodeLabel(id) {
    const n = nodes.find((x) => x.id === id);
    return n ? (n.data?.label || TYPE_LABELS[n.type] || n.type) : id;
  }

  if (!bot) return <div className="loading">Загрузка...</div>;

  const STATUS_COLOR = { active: '#4CAF50', stopped: '#607D8B', error: '#F44336' };
  const STATUS_LABEL = { active: 'Активен', stopped: 'Остановлен', error: 'Ошибка' };

  // Determine which right panel to show
  const showEdgePanel = !!selectedEdge && !showSettings;
  const showNodePanel = !!selectedNode && !showSettings && !selectedEdge;

  return (
    <div className="editor-page" onClick={() => contextMenu && setContextMenu(null)}>
      {guideStep >= 0 && (
        <Guide
          steps={EDITOR_GUIDE_STEPS}
          stepIndex={guideStep}
          onNext={() => guideStep < EDITOR_GUIDE_STEPS.length - 1 ? setGuideStep(guideStep + 1) : finishEditorGuide()}
          onSkip={finishEditorGuide}
        />
      )}

      {showTokenVideo && (
        <VideoModal
          src={TOKEN_VIDEO}
          title="Как получить Telegram Bot Token"
          onClose={() => setShowTokenVideo(false)}
        />
      )}

      {nodePreview && (
        <NodePreview
          type={nodePreview.type}
          walkIdx={nodePreview.walkIdx}
          walkTotal={nodePreview.walkIdx !== null ? PREVIEW_WALK.length : 0}
          onNext={nextPreview}
          onPrev={prevPreview}
          onClose={closePreview}
        />
      )}

      {/* ── Toolbar ── */}
      <div className="editor-toolbar">
        <button className="btn-outline btn-sm" onClick={() => navigate('/')}>← Назад</button>
        <span className="editor-bot-name">{bot.name}</span>
        <span className="status-dot" style={{ background: STATUS_COLOR[status] }} />
        <span style={{ fontSize: 12, color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</span>
        {error && <span className="error" style={{ fontSize: 12 }}>{error}</span>}
        <div style={{ flex: 1 }} />
        <button className="guide-help-btn" title="Запустить обучение" onClick={() => setGuideStep(0)}>?</button>
        <button className="btn-outline btn-sm" data-guide="settings-btn" onClick={() => { setShowSettings(true); setSelectedNode(null); setSelectedEdge(null); }}>
          Настройки
        </button>
        <button className="btn-outline btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button
          data-guide="run-btn"
          className={status === 'active' ? 'btn-danger btn-sm' : 'btn-success btn-sm'}
          onClick={handleToggle}
        >
          {status === 'active' ? 'Остановить' : 'Запустить'}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="editor-body">
        <div className="editor-palette" data-guide="palette">
          <p className="palette-title">Блоки</p>
          {PALETTE.map((item) => (
            <div key={item.type} className="palette-item-row">
              <button
                className="palette-item"
                data-palette={item.type}
                onClick={() => addNode(item.type)}
              >
                + {item.label}
              </button>
              {NODE_PREVIEWS[item.type] && (
                <button
                  className="palette-eye"
                  title={`Как выглядит «${item.label}» в боте`}
                  onClick={(e) => openSinglePreview(item.type, e)}
                >
                  👁
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Canvas ── */}
        <div className="editor-canvas" data-guide="canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={null}
            defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
          >
            <Background color="#333" gap={20} />
            <Controls />
            <MiniMap nodeColor="#555" maskColor="#111a" />
          </ReactFlow>

          {/* Trash zone — appears while dragging a node */}
          {isDragging && (
            <div
              ref={trashRef}
              className={`trash-zone${trashHover ? ' trash-zone--over' : ''}`}
            >
              <span className="trash-icon">🗑</span>
              {trashHover ? 'Отпустите для удаления' : 'Перетащите сюда для удаления'}
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        {showNodePanel && (
          <NodeEditor
            node={selectedNode}
            onChange={handleNodeDataChange}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {showEdgePanel && (
          <div className="node-editor">
            <div className="node-editor-header">
              <h3>Связь</h3>
              <button onClick={() => setSelectedEdge(null)}>✕</button>
            </div>

            <label>Источник</label>
            <div className="edge-info-row">
              <span className="edge-node-name">{nodeLabel(selectedEdge.source)}</span>
              {selectedEdge.sourceHandle && (
                <span className="edge-handle-badge">{selectedEdge.sourceHandle}</span>
              )}
            </div>

            <div className="edge-arrow">↓</div>

            <label>Цель</label>
            <div className="edge-info-row">
              <span className="edge-node-name">{nodeLabel(selectedEdge.target)}</span>
            </div>

            <button
              className="btn-danger"
              style={{ marginTop: 20, width: '100%' }}
              onClick={() => removeEdge(selectedEdge.id)}
            >
              Отсоединить
            </button>
          </div>
        )}

        {showSettings && (
          <BotSettings
            bot={bot}
            onSave={handleSettingsSave}
            onClearToken={handleTokenCleared}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* ── Right-click context menu ── */}
      {contextMenu && (
        <ul
          className="ctx-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <li
            className="ctx-item ctx-danger"
            onClick={() => removeNode(contextMenu.nodeId)}
          >
            🗑 Удалить блок
          </li>
        </ul>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
