import { useState, useEffect } from 'react';

const OPERATORS = [
  { value: 'equals', label: 'равно (==)' },
  { value: 'notEquals', label: 'не равно (!=)' },
  { value: 'contains', label: 'содержит' },
  { value: 'greaterThan', label: 'больше (>)' },
  { value: 'lessThan', label: 'меньше (<)' },
  { value: 'greaterOrEqual', label: 'больше или равно (≥)' },
  { value: 'lessOrEqual', label: 'меньше или равно (≤)' },
];

let _condId = 0;
function condId() { return `c${Date.now()}_${_condId++}`; }

export default function NodeEditor({ node, onChange, onClose }) {
  const [data, setData] = useState(node.data);

  useEffect(() => {
    setData(node.data);
  }, [node.id]);

  function update(patch) {
    const next = { ...data, ...patch };
    setData(next);
    onChange(node.id, next);
  }

  // ── Buttons helpers ──────────────────────────────────────────────────────
  function updateButton(i, value) {
    const buttons = [...(data.buttons || [])];
    buttons[i] = { ...buttons[i], label: value };
    update({ buttons });
  }
  function addButton() { update({ buttons: [...(data.buttons || []), { label: 'Кнопка' }] }); }
  function removeButton(i) { update({ buttons: (data.buttons || []).filter((_, idx) => idx !== i) }); }

  // ── MultiCondition helpers ───────────────────────────────────────────────
  function updateCond(i, patch) {
    const conditions = [...(data.conditions || [])];
    conditions[i] = { ...conditions[i], ...patch };
    update({ conditions });
  }
  function addCond() {
    update({ conditions: [...(data.conditions || []), { id: condId(), variableName: '', condition: 'equals', value: '' }] });
  }
  function removeCond(i) {
    update({ conditions: (data.conditions || []).filter((_, idx) => idx !== i) });
  }

  return (
    <div className="node-editor">
      <div className="node-editor-header">
        <h3>Редактор блока</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <label>Название блока</label>
      <input value={data.label || ''} onChange={(e) => update({ label: e.target.value })} />

      {/* ── Message / Notification ── */}
      {(node.type === 'message' || node.type === 'notification') && (
        <>
          <label>Текст сообщения</label>
          <textarea rows={4} value={data.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="Поддерживает {{переменные}}" />
        </>
      )}

      {/* ── Buttons ── */}
      {node.type === 'buttons' && (
        <>
          <label>Текст перед кнопками</label>
          <textarea rows={3} value={data.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="Поддерживает {{переменные}}" />
          <label>Сохранить выбор в переменную</label>
          <input value={data.saveAs || ''} onChange={(e) => update({ saveAs: e.target.value })} placeholder="например: service" />
          <label>Кнопки</label>
          {(data.buttons || []).map((btn, i) => (
            <div key={i} className="button-row">
              <input value={btn.label || ''} onChange={(e) => updateButton(i, e.target.value)} />
              <button className="btn-icon" onClick={() => removeButton(i)}>✕</button>
            </div>
          ))}
          <button className="btn-outline btn-sm" onClick={addButton}>+ Добавить кнопку</button>
        </>
      )}

      {/* ── Menu (persistent keyboard) ── */}
      {node.type === 'menu' && (
        <>
          <p className="hint" style={{ margin: '4px 0 8px' }}>
            Постоянная клавиатура - остаётся в чате. Каждая кнопка - отдельная ветка.
          </p>
          <label>Сохранить выбор в переменную</label>
          <input value={data.saveAs || ''} onChange={(e) => update({ saveAs: e.target.value })} placeholder="например: menu_choice" />
          <label>Пункты меню</label>
          {(data.buttons || []).map((btn, i) => (
            <div key={i} className="button-row">
              <input value={btn.label || ''} onChange={(e) => updateButton(i, e.target.value)} />
              <button className="btn-icon" onClick={() => removeButton(i)}>✕</button>
            </div>
          ))}
          <button className="btn-outline btn-sm" onClick={addButton}>+ Добавить пункт</button>
        </>
      )}

      {/* ── Question ── */}
      {node.type === 'question' && (
        <>
          <label>Текст вопроса</label>
          <textarea rows={3} value={data.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="Поддерживает {{переменные}}" />
          <label>Тип ожидаемого ответа</label>
          <select value={data.answerType || 'text'} onChange={(e) => update({ answerType: e.target.value })}>
            <option value="text">Текст - любой ответ</option>
            <option value="date">Дата - проверяет формат и что не в прошлом</option>
            <option value="time">Время - проверяет формат ЧЧ:ММ</option>
          </select>
          {data.answerType === 'date' && (
            <p className="hint">Принимает: «25 июня», «25.06», «25.06.2025». Дата в прошлом - отклоняется.</p>
          )}
          {data.answerType === 'time' && (
            <>
              <p className="hint">Принимает: «14:00», «9:30», «1400». Хранится в формате ЧЧ:ММ.</p>
              <label>Переменная с датой (для фильтра занятых слотов)</label>
              <input value={data.dateVar || ''} onChange={(e) => update({ dateVar: e.target.value })} placeholder="например: date" />
              <p className="hint">Если расписание включено - скрывает уже занятые слоты в пикере.</p>
            </>
          )}
          <label>Сохранить ответ в переменную</label>
          <input value={data.variableName || ''} onChange={(e) => update({ variableName: e.target.value })} placeholder="например: date" />
        </>
      )}

      {/* ── Condition ── */}
      {node.type === 'condition' && (
        <>
          <label>Переменная</label>
          <input value={data.variableName || ''} onChange={(e) => update({ variableName: e.target.value })} placeholder="например: service" />
          <label>Условие</label>
          <select value={data.condition || 'equals'} onChange={(e) => update({ condition: e.target.value })}>
            {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>
          <label>Значение</label>
          <input value={data.value || ''} onChange={(e) => update({ value: e.target.value })} placeholder="значение для сравнения" />
        </>
      )}

      {/* ── MultiCondition ── */}
      {node.type === 'multiCondition' && (
        <>
          <label>Ветви условий</label>
          {(data.conditions || []).map((cond, i) => (
            <div key={cond.id} className="multicond-row">
              <div className="multicond-label">{i === 0 ? 'if' : 'else if'}</div>
              <input
                value={cond.variableName || ''}
                onChange={(e) => updateCond(i, { variableName: e.target.value })}
                placeholder="переменная"
                style={{ marginBottom: 4 }}
              />
              <select value={cond.condition || 'equals'} onChange={(e) => updateCond(i, { condition: e.target.value })} style={{ marginBottom: 4 }}>
                {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
              <input
                value={cond.value || ''}
                onChange={(e) => updateCond(i, { value: e.target.value })}
                placeholder="значение"
                style={{ marginBottom: 4 }}
              />
              <button className="btn-icon btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 4 }} onClick={() => removeCond(i)}>✕</button>
            </div>
          ))}
          <div className="multicond-else">else → (всегда выполняется если ни одно не совпало)</div>
          <button className="btn-outline btn-sm" onClick={addCond} style={{ marginTop: 4 }}>+ Добавить ветвь</button>
        </>
      )}

      {/* ── SaveData ── */}
      {node.type === 'saveData' && (
        <>
          <label>Переменная</label>
          <input value={data.variableName || ''} onChange={(e) => update({ variableName: e.target.value })} placeholder="например: confirmed" />
          <label>Значение</label>
          <input value={data.value || ''} onChange={(e) => update({ value: e.target.value })} placeholder="Поддерживает {{переменные}}" />
        </>
      )}

      {/* ── Booking ── */}
      {node.type === 'booking' && (
        <>
          <p className="hint" style={{ margin: '4px 0 8px' }}>
            Проверяет, свободен ли слот, и фиксирует запись. Правый выход ✓ - слот свободен, ✗ - занят.
          </p>
          <label>Переменная с датой</label>
          <input value={data.dateVar || ''} onChange={(e) => update({ dateVar: e.target.value })} placeholder="например: date" />
          <label>Переменная со временем</label>
          <input value={data.timeVar || ''} onChange={(e) => update({ timeVar: e.target.value })} placeholder="например: time" />
          <p className="hint">Формат: дата - «дд.мм.гггг», время - «ЧЧ:ММ». Длительность слота берётся из расписания бота.</p>
        </>
      )}
    </div>
  );
}
