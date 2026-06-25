import { useRef, useLayoutEffect, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

const COLOR = '#00BCD4';

export default function MenuNode({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const buttons = data.buttons || [];
  const nodeRef = useRef(null);
  const rowRefs = useRef([]);
  const [handleTops, setHandleTops] = useState([]);

  const buttonsKey = buttons.map((b) => b.label || b).join('|');

  useLayoutEffect(() => {
    if (!nodeRef.current) return;
    const tops = rowRefs.current.map((el) => el ? el.offsetTop + el.offsetHeight / 2 : 0);
    setHandleTops((prev) => {
      if (prev.length === tops.length && prev.every((v, i) => Math.abs(v - tops[i]) < 1)) return prev;
      return tops;
    });
    updateNodeInternals(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, buttonsKey, data.label]);

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'relative',
        border: `2px solid ${selected ? '#fff' : COLOR}`,
        borderRadius: 8,
        background: selected ? COLOR : '#1e1e2e',
        color: '#fff',
        minWidth: 180,
        maxWidth: 260,
        boxShadow: selected ? `0 0 0 3px ${COLOR}55` : '0 2px 8px #0006',
        fontSize: 13,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ background: COLOR, padding: '4px 10px', borderRadius: '6px 6px 0 0', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        Главное меню
      </div>

      <div style={{ padding: '8px 10px' }}>
        {data.label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.label}</div>}
        <p style={{ margin: '0 0 2px', opacity: 0.55, fontSize: 10 }}>
          Постоянная клавиатура внизу чата
        </p>
        <div style={{ height: 4 }} />
        {buttons.map((btn, i) => (
          <div
            key={i}
            ref={(el) => (rowRefs.current[i] = el)}
            style={{
              background: `${COLOR}22`,
              border: `1px solid ${COLOR}`,
              borderRadius: 4,
              padding: '3px 24px 3px 8px',
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            {btn.label || btn}
          </div>
        ))}
      </div>

      {buttons.map((btn, i) => (
        <Handle
          key={`h-${i}`}
          type="source"
          position={Position.Right}
          id={btn.label || String(i)}
          style={{ top: handleTops[i] ?? '50%', right: -5, width: 10, height: 10 }}
        />
      ))}
    </div>
  );
}
