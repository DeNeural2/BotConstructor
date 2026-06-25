import BaseNode from './BaseNode';

export default function EndNode({ data, selected }) {
  return (
    <BaseNode type="end" data={data} selected={selected} hasSource={false}>
      <span style={{ opacity: 0.7, fontSize: 12 }}>Конец сценария</span>
    </BaseNode>
  );
}
