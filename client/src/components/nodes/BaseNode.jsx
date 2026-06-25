import { Handle, Position } from 'reactflow';

const TYPE_COLORS = {
  start: '#4CAF50',
  message: '#2196F3',
  buttons: '#FF9800',
  question: '#9C27B0',
  condition: '#F44336',
  saveData: '#00BCD4',
  notification: '#FF5722',
  end: '#607D8B',
};

const TYPE_LABELS = {
  start: 'Старт',
  message: 'Сообщение',
  buttons: 'Кнопки',
  question: 'Вопрос',
  condition: 'Условие',
  saveData: 'Сохранить данные',
  notification: 'Уведомление',
  end: 'Конец',
};

export default function BaseNode({ type, data, selected, children, hasSource = true, hasTarget = true }) {
  const color = TYPE_COLORS[type] || '#999';
  return (
    <div
      style={{
        border: `2px solid ${selected ? '#fff' : color}`,
        borderRadius: 8,
        background: selected ? color : '#1e1e2e',
        color: '#fff',
        minWidth: 180,
        maxWidth: 260,
        boxShadow: selected ? `0 0 0 3px ${color}55` : '0 2px 8px #0006',
        fontSize: 13,
      }}
    >
      {hasTarget && <Handle type="target" position={Position.Top} />}
      <div
        style={{
          background: color,
          padding: '4px 10px',
          borderRadius: '6px 6px 0 0',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {TYPE_LABELS[type] || type}
      </div>
      <div style={{ padding: '8px 10px' }}>
        {data.label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.label}</div>}
        {children}
      </div>
      {hasSource && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}
