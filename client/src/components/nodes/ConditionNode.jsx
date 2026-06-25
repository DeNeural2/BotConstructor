import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';

export default function ConditionNode({ data, selected }) {
  return (
    <BaseNode type="condition" data={data} selected={selected} hasSource={false}>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
        {`{{${data.variableName || '?'}}} ${data.condition || 'equals'} "${data.value || ''}"`}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
        <span style={{ color: '#4CAF50' }}>Да</span>
        <span style={{ color: '#F44336' }}>Нет</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} />
    </BaseNode>
  );
}
