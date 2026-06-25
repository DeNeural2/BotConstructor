import BaseNode from './BaseNode';

export default function MessageNode({ data, selected }) {
  return (
    <BaseNode type="message" data={data} selected={selected}>
      <p style={{ margin: 0, opacity: 0.85, whiteSpace: 'pre-wrap', fontSize: 12 }}>
        {data.text || <em>Текст не задан</em>}
      </p>
    </BaseNode>
  );
}
