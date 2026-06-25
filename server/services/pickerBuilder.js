const MONTH_NAMES = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function t2m(t) { // "hh:mm" → minutes since midnight
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function m2t(mins) { // minutes since midnight → "hh:mm"
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// True if a slot [startMins, startMins+duration) doesn't overlap any booked slot
function slotFree(startMins, duration, bookedSlots) {
  const end = startMins + duration;
  return !bookedSlots.some(({ timeFrom, timeTo }) => {
    const bs = t2m(timeFrom);
    const be = t2m(timeTo);
    return startMins < be && end > bs;
  });
}

// Returns true if the hour has AT LEAST one free slot (for greying hours in picker)
function hourHasFreeSlot(h, workEndMins, duration, bookedSlots, slotStep) {
  for (let m = 0; m < 60; m += slotStep) {
    const start = h * 60 + m;
    if (start + duration > workEndMins) break;
    if (slotFree(start, duration, bookedSlots)) return true;
  }
  return false;
}

// ── Calendar ────────────────────────────────────────────────────────────────
function buildCalendar(year, month, opts = {}) {
  const { workDays } = opts; // undefined = no restriction
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear  = month === 11 ? year + 1 : year;

  const rows = [];
  rows.push([
    { text: '◀', callback_data: `cal:nav:${prevYear}:${prevMonth}` },
    { text: `${MONTH_NAMES[month]} ${year}`, callback_data: 'cal:x' },
    { text: '▶', callback_data: `cal:nav:${nextYear}:${nextMonth}` },
  ]);
  rows.push(DAY_NAMES.map((d) => ({ text: d, callback_data: 'cal:x' })));

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  let row = [];
  for (let i = 0; i < firstWeekday; i++) row.push({ text: ' ', callback_data: 'cal:x' });

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const weekday = (dt.getDay() + 6) % 7; // 0=Mon
    const isPast    = dt < today;
    const isToday   = dt.getTime() === today.getTime();
    const isOffDay  = workDays && !workDays.includes(weekday);
    const blocked   = isPast || isOffDay;

    let label = String(d);
    if (isToday) label = `[${d}]`;
    if (isOffDay && !isPast) label = `·${d}·`;

    row.push({
      text: isPast ? '·' : label,
      callback_data: blocked ? 'cal:x' : `cal:pick:${year}:${month}:${d}`,
    });
    if (row.length === 7) { rows.push(row); row = []; }
  }
  if (row.length) {
    while (row.length < 7) row.push({ text: ' ', callback_data: 'cal:x' });
    rows.push(row);
  }

  return rows;
}

// ── Hour picker ──────────────────────────────────────────────────────────────
function buildHourPicker(opts = {}) {
  const {
    workStart    = '00:00',
    workEnd      = '23:59',
    slotDuration = 60,
    bookedSlots  = [],
  } = opts;

  const startH   = Math.floor(t2m(workStart) / 60);
  const endMins  = t2m(workEnd);
  const slotStep = slotDuration >= 60 ? 60 : 30;

  const rows = [];
  let row   = [];

  for (let h = startH; h * 60 < endMins; h++) {
    if (h * 60 + slotDuration > endMins + 59) break; // no full slot fits
    const hasFree = hourHasFreeSlot(h, endMins, slotDuration, bookedSlots, slotStep);
    const hh = String(h).padStart(2, '0');
    row.push({
      text: hasFree ? `${hh}:__` : `✗${hh}`,
      callback_data: hasFree ? `time:h:${h}` : 'time:x',
    });
    if (row.length === 4) { rows.push(row); row = []; }
  }
  if (row.length) rows.push(row);
  return rows;
}

// ── Minute picker ────────────────────────────────────────────────────────────
function buildMinutePicker(hour, opts = {}) {
  const {
    workEnd      = '23:59',
    slotDuration = 60,
    bookedSlots  = [],
  } = opts;

  const endMins  = t2m(workEnd);
  const slotStep = slotDuration >= 60 ? 60 : 30;
  const hh = String(hour).padStart(2, '0');

  const slotBtns = [];
  for (let m = 0; m < 60; m += slotStep) {
    const startMins = hour * 60 + m;
    if (startMins + slotDuration > endMins) break;
    const free = slotFree(startMins, slotDuration, bookedSlots);
    const mm = String(m).padStart(2, '0');
    slotBtns.push({
      text: free ? `${hh}:${mm}` : `✗${hh}:${mm}`,
      callback_data: free ? `time:pick:${hour}:${m}` : 'time:x',
    });
  }

  return [
    slotBtns,
    [{ text: '◀ Другой час', callback_data: 'time:back' }],
  ];
}

module.exports = { buildCalendar, buildHourPicker, buildMinutePicker, t2m, m2t, slotFree };
