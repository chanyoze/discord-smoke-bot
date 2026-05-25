// 한국 시간(KST, UTC+9) 기준으로 "오늘 시작", "이번 주 시작" 시각을
// UTC 밀리초로 계산해 돌려줍니다. 기록은 Date.now()(UTC ms)로 저장하므로
// 여기서 나온 경계값과 비교만 하면 됩니다.

const KST = 9 * 60 * 60 * 1000; // 9시간
const DAY = 24 * 60 * 60 * 1000; // 하루

// KST 기준 "오늘 00:00"의 UTC 밀리초
export function kstDayStart(ts = Date.now()) {
  const kst = ts + KST;
  const dayStartKst = Math.floor(kst / DAY) * DAY;
  return dayStartKst - KST;
}

// KST 기준 "이번 주 월요일 00:00"의 UTC 밀리초
export function kstWeekStart(ts = Date.now()) {
  const kst = ts + KST;
  const d = new Date(kst);
  const dow = d.getUTCDay();              // 0=일 ~ 6=토 (KST로 이미 보정됨)
  const sinceMonday = dow === 0 ? 6 : dow - 1;
  const dayStartKst = Math.floor(kst / DAY) * DAY;
  return dayStartKst - sinceMonday * DAY - KST;
}

// KST 기준 "이번 달 1일 00:00"의 UTC 밀리초
export function kstMonthStart(ts = Date.now()) {
  const d = new Date(ts + KST); // UTC 필드에 KST 값이 담긴 시각
  const monthStartAsUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  return monthStartAsUtc - KST;
}
