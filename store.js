// data.json 파일에 기록을 저장하는 아주 단순한 저장소.
// (친구 그룹 규모에는 충분하고, Windows에서 별도 빌드 도구가 필요 없습니다.)
//
// 레코드 1건 = "특정 세션에서 특정 유저가 몇 개비 폈는지"
// 같은 세션에서 같은 유저가 버튼을 다시 누르면 개비 수만 갱신됩니다.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// 로컬에서는 현재 폴더, Railway에서는 볼륨 경로(예: /data)에 저장.
// 환경변수 DATA_DIR 로 위치를 바꿀 수 있습니다.
const DATA_DIR = process.env.DATA_DIR || '.';
mkdirSync(DATA_DIR, { recursive: true });
const FILE = join(DATA_DIR, 'data.json');

function load() {
  if (!existsSync(FILE)) return { records: [] };
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'));
  } catch {
    return { records: [] };
  }
}

function save(data) {
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// 세션 내 유저의 개비 수를 설정(없으면 추가, 있으면 갱신)
export function setCount({ sessionId, guildId, channelId, userId, username, count }) {
  const data = load();
  const found = data.records.find(
    (r) => r.sessionId === sessionId && r.userId === userId
  );
  if (found) {
    found.count = count;
    found.username = username;
  } else {
    data.records.push({
      sessionId,
      guildId,
      channelId,
      userId,
      username,
      count,
      createdAt: Date.now(),
    });
  }
  save(data);
}

// 세션에서 유저의 참여 기록 삭제
export function removeUser(sessionId, userId) {
  const data = load();
  data.records = data.records.filter(
    (r) => !(r.sessionId === sessionId && r.userId === userId)
  );
  save(data);
}

// 한 세션의 모든 참여 기록
export function getSession(sessionId) {
  return load().records.filter((r) => r.sessionId === sessionId);
}

// from(UTC ms) 이후 기록을 유저별로 합산해 순위 배열로 반환
export function ranking(guildId, from = 0) {
  const { records } = load();
  const map = new Map();
  for (const r of records) {
    if (r.guildId !== guildId) continue;
    if (r.createdAt < from) continue;
    const cur = map.get(r.userId) ?? { username: r.username, total: 0 };
    cur.total += r.count;
    cur.username = r.username; // 최신 표시명 유지
    map.set(r.userId, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
