import { useRef, useLayoutEffect, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

const COLOR = '#E91E63';

const OP_LABELS = {
  equals: '==', notEquals: '!=', contains: '∋',
  greaterThan: '>', lessThan: '<', greaterOrEqual: '≥', lessOrEqual: '≤',
};

export default function MultiConditionNode({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const conditions = data.conditions || [];
  const nodeRef = useRef(null);
  const rowRefs = useRef([]);
  const elseRef = useRef(null);
  const [handleTops, setHandleTops] = useState([]);
  const [elseTop, setElseTop] = useState(null);

  const condKey = conditions.map((c) => `${c.id}${c.variableName}${c.condition}${c.value}`).join('|');

  useLayoutEffect(() => {
    if (!nodeRef.current) return;
    const tops = rowRefs.current.map((el) => el ? el.offsetTop + el.offsetHeight / 2 : 0);
    const et = elseRef.current ? elseRef.current.offsetTop + elseRef.current.offsetHeight / 2 : null;

    setHandleTops((prev) => {
      if (prev.length === tops.length && prev.every((v, i) => Math.abs(v - tops[i]) < 1)) return prev;
      return tops;
    });
    setElseTop((prev) => (et !== null && Math.abs((prev ?? 0) - et) < 1 ? prev : et));
    updateNodeInternals(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, condKey, data.label]);

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'relative',
        border: `2px solid ${selected ? '#fff' : COLOR}`,
        borderRadius: 8,
        background: selected ? COLOR : '#1e1e2e',
        color: '#fff',
        minWidth: 200,
        maxWidth: 280,
        boxShadow: selected ? `0 0 0 3px ${COLOR}55` : '0 2px 8px #0006',
        fontSize: 13,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ background: COLOR, padding: '4px 10px', borderRadius: '6px 6px 0 0', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        Мульти-условие
      </div>

      <div style={{ padding: '8px 10px' }}>
        {data.label && <div style={{ fontWeight: 600, marginBottom: 6 }}>{data.label}</div>}

        {conditions.map((cond, i) => (
          <div
            key={cond.id}
            ref={(el) => (rowRefs.current[i] = el)}
            style={{ background: '#E91E6322', border: '1px solid #E91E63', borderRadius: 4, padding: '3px 24px 3px 8px', marginBottom: 4, fontSize: 11, fontFamily: 'monospace' }}
          >
            <span style={{ opacity: 0.6, marginRight: 4 }}>{i === 0 ? 'if' : 'else if'}</span>
            {cond.variableName || '?'}{' '}
            <span style={{ color: COLOR }}>{OP_LABELS[cond.condition] || '=='}</span>{' '}
            {cond.value || '?'}
          </div>
        ))}

        <div
          ref={elseRef}
          style={{ background: '#ffffff11', border: '1px dashed #888', borderRadius: 4, padding: '3px 24px 3px 8px', fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}
        >
          else
        </div>
      </div>

      {conditions.map((cond, i) => (
        <Handle
          key={`h-${cond.id}`}
          type="source"
          position={Position.Right}
          id={cond.id}
          style={{ top: handleTops[i] ?? '50%', right: -5, width: 10, height: 10 }}
        />
      ))}
      <Handle
        type="source"
        position={Position.Right}
        id="else"
        style={{ top: elseTop ?? '90%', right: -5, width: 10, height: 10, background: '#888', borderColor: '#555' }}
      />
    </div>
  );
}
