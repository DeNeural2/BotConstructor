import BaseNode from './BaseNode';

export default function QuestionNode({ data, selected }) {
  return (
    <BaseNode type="question" data={data} selected={selected}>
      <p style={{ margin: '0 0 4px', fontSize: 12, opacity: 0.85 }}>{data.text || <em>Вопрос не задан</em>}</p>
      {data.variableName && (
        <span style={{ fontSize: 11, opacity: 0.6 }}>→ {`{{${data.variableName}}}`}</span>
      )}
    </BaseNode>
  );
}
