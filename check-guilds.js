// 봇이 현재 들어가 있는 서버 목록을 확인하는 일회성 점검 스크립트.
import 'dotenv/config';

const TARGET = '597655483557609491';

const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
  headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
});

if (!res.ok) {
  console.error('❌ API 오류:', res.status, await res.text());
  process.exit(1);
}

const guilds = await res.json();
console.log('봇이 들어가 있는 서버 목록:');
for (const g of guilds) {
  console.log(`  - ${g.name} (${g.id})${g.id === TARGET ? '  ← 찾던 서버!' : ''}`);
}

const inTarget = guilds.some((g) => g.id === TARGET);
console.log(
  inTarget
    ? `\n✅ 서버 ${TARGET} 에 봇이 들어가 있습니다.`
    : `\n❌ 서버 ${TARGET} 에는 봇이 아직 없습니다 (초대 필요).`
);
