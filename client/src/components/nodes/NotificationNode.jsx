import BaseNode from './BaseNode';

export default function NotificationNode({ data, selected }) {
  return (
    <BaseNode type="notification" data={data} selected={selected}>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
        {data.text || <em>Текст уведомления не задан</em>}
      </p>
    </BaseNode>
  );
}
