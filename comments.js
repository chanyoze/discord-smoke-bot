// 명일방주(Arknights) 라플란드 / 켈시 말투의 랜덤 멘트.
// 세션 누적 개비 수가 "3개비 단위"를 새로 넘을 때마다(3, 6, 9...) 발동하며,
// 단계가 올라갈 때마다 두 캐릭터가 번갈아 등장합니다.

const lappland = [
  '또 피우네~ 점점 재밌어지는걸, 박사?',
  '크크, 폐가 비명 지르는 소리가 여기까지 들리는데?',
  '말리지 않을게. 난 그런 무모함이 마음에 들거든.',
  '오늘도 아주 열심이구나. 어디 끝까지 가보자고~',
  '담배 연기… 꽤 흥미로운 냄새야. 더 피워봐.',
  '재미없게 끊을 생각은 아니지? 날 실망시키지 마.',
  '후훗, 너 진짜 못 말리는 타입이구나. 좋아.',
  '한 대 더? 그래야 너답지. 계속해.',
];

const kaltsit = [
  '또 피웠군. 네 폐 데이터가 좋지 않아.',
  '흡연을 멈춰. 의학적으로 권고하는 바다.',
  '이런 식이면 진료 기록에 한 줄 더 추가해야겠군.',
  '건강은 소모품이 아니다. 명심해.',
  '수치가 경고를 보내고 있다. 무시하지 마라.',
  '다시 한번 권고한다. 줄여라.',
  '네 몸은 하나뿐이다. 함부로 다루지 마.',
  '한심하군. 그래도 치료를 포기하진 않겠다.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 누적 total 이 3의 배수를 새로 넘었는지 판정
export function crossedThreshold(oldTotal, newTotal) {
  return newTotal > oldTotal && Math.floor(newTotal / 3) > Math.floor(oldTotal / 3);
}

// 3개비 단위 단계(step)에 따라 라플란드/켈시 번갈아 멘트
export function pickComment(newTotal) {
  const step = Math.floor(newTotal / 3); // 3→1, 6→2, 9→3 ...
  const isLappland = step % 2 === 1;
  return isLappland
    ? { who: '라플란드', emoji: '🐺', line: pick(lappland) }
    : { who: '켈시', emoji: '🩺', line: pick(kaltsit) };
}
