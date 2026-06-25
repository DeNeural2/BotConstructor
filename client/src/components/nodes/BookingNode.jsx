import { Handle, Position } from 'reactflow';

const COLOR = '#FF9800';
const FREE_COLOR  = '#2ecc71';
const TAKEN_COLOR = '#e53935';

export default function BookingNode({ data, selected }) {
  return (
    <div style={{
      position: 'relative',
      border: `2px solid ${selected ? '#fff' : COLOR}`,
      borderRadius: 8,
      background: selected ? COLOR : '#1e1e2e',
      color: '#fff',
      minWidth: 190,
      boxShadow: selected ? `0 0 0 3px ${COLOR}55` : '0 2px 8px #0006',
      fontSize: 13,
    }}>
      <Handle type="target" position={Position.Top} />

      <div style={{ background: COLOR, padding: '4px 10px', borderRadius: '6px 6px 0 0', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        📅 Зафиксировать бронь
      </div>

      <div style={{ padding: '8px 10px' }}>
        {data.label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.label}</div>}
        <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1.6 }}>
          <div>Дата: <b>{'{{' + (data.dateVar || '?') + '}}'}</b></div>
          <div>Время: <b>{'{{' + (data.timeVar || '?') + '}}'}</b></div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 10, background: `${FREE_COLOR}22`, border: `1px solid ${FREE_COLOR}`, color: FREE_COLOR, borderRadius: 4, padding: '2px 6px' }}>✓ Свободно</span>
          <span style={{ fontSize: 10, background: `${TAKEN_COLOR}22`, border: `1px solid ${TAKEN_COLOR}`, color: TAKEN_COLOR, borderRadius: 4, padding: '2px 6px' }}>✗ Занято</span>
        </div>
      </div>

      {/* Two source handles */}
      <Handle type="source" position={Position.Right} id="free"  style={{ top: '62%', right: -5, background: FREE_COLOR,  width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} id="taken" style={{ top: '82%', right: -5, background: TAKEN_COLOR, width: 10, height: 10 }} />
    </div>
  );
}
