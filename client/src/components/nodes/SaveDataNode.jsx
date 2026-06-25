import BaseNode from './BaseNode';

export default function SaveDataNode({ data, selected }) {
  return (
    <BaseNode type="saveData" data={data} selected={selected}>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
        {`{{${data.variableName || '?'}}} = ${data.value || ''}`}
      </p>
    </BaseNode>
  );
}
