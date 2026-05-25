// 슬래시 커맨드(/담배 /오늘 /이번주 /순위)를 디스코드에 등록하는 스크립트.
// 커맨드를 추가/변경했을 때 한 번씩 "npm run deploy" 로 실행하세요.

import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder().setName('담배').setDescription('담배 타임 세션을 시작합니다'),
  new SlashCommandBuilder().setName('오늘').setDescription('오늘 담배 순위를 봅니다'),
  new SlashCommandBuilder().setName('이번주').setDescription('이번 주 담배 순위를 봅니다'),
  new SlashCommandBuilder().setName('순위').setDescription('전체 누적 담배 순위를 봅니다'),
  new SlashCommandBuilder()
    .setName('내기록')
    .setDescription('내 담배 기록을 봅니다 (대상 지정 시 그 사람 기록)')
    .addUserOption((o) =>
      o.setName('대상').setDescription('다른 사람 기록 보기 (선택)').setRequired(false)
    ),
].map((c) => c.toJSON());

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ .env 에 DISCORD_TOKEN 과 CLIENT_ID 를 먼저 채워주세요.');
  process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);

// GUILD_ID 는 콤마(,)로 여러 서버를 넣을 수 있습니다. 비우면 전체(글로벌) 등록.
const guildIds = (GUILD_ID ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

try {
  if (guildIds.length) {
    for (const gid of guildIds) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, gid), { body: commands });
      console.log(`✅ 서버 ${gid} 등록 완료 (즉시 반영)`);
    }
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ 전체(글로벌) 등록 완료 (반영까지 최대 1시간)');
  }
} catch (err) {
  console.error('❌ 등록 실패:', err);
  process.exit(1);
}
