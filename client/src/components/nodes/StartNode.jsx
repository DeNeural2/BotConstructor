import BaseNode from './BaseNode';

export default function StartNode({ data, selected }) {
  return (
    <BaseNode type="start" data={data} selected={selected} hasTarget={false}>
      <span style={{ opacity: 0.7 }}>/start</span>
    </BaseNode>
  );
}
