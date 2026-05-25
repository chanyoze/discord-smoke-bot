// 메인 봇.
//  - 채팅 "담배 피실 분" / 슬래시 /담배 → 세션 카드 (3분 뒤 자동 마감)
//  - 버튼(1/2/3개비, 직접입력, 참여취소)으로 집계 + 담배값 환산
//  - /오늘 /이번주 /순위 통계, /내기록 개인 기록
//  - 3개비 단위마다 라플란드/켈시 랜덤 멘트
//  - 장시간 무흡연 시 축하 알림

import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';

import {
  setCount,
  removeUser,
  getSession,
  ranking,
  userTotal,
  touchSmoke,
  getMeta,
  markAlerted,
} from './store.js';
import {
  buildButtons,
  buildSessionEmbed,
  buildClosedEmbed,
  buildCountModal,
  rankingEmbed,
  myRecordEmbed,
} from './ui.js';
import { kstDayStart, kstWeekStart, kstMonthStart } from './time.js';
import { crossedThreshold, pickComment } from './comments.js';

const AUTO_CLOSE_MS = 3 * 60 * 1000; // 세션 자동 마감: 3분
const ALERT_HOURS = Number(process.env.NO_SMOKE_ALERT_HOURS || 3); // 무흡연 알림 기준 시간
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 무흡연 체크 주기: 15분

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // "담배 피실 분" 자동 감지에 필요(포털에서 켜야 함)
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ 로그인 완료: ${c.user.tag}`);
  setInterval(checkNoSmoke, CHECK_INTERVAL_MS); // 무흡연 알림 주기 체크 시작
});

// 표시명 얻기(서버 별명 우선)
function nameOf(interaction) {
  return interaction.member?.displayName ?? interaction.user.username;
}

function sessionTotal(sessionId) {
  return getSession(sessionId).reduce((s, r) => s + r.count, 0);
}

// 채팅 트리거 패턴: "담배 피실/푸실/펴실/필 분" (띄어쓰기 유무 무관)
const TRIGGER = /담배\s*(피실|푸실|펴실|필)\s*분/;

// 세션 카드 생성 후 3분 뒤 자동 마감 예약
function scheduleAutoClose(message) {
  setTimeout(async () => {
    try {
      await message.edit({
        embeds: [buildClosedEmbed(getSession(message.id))],
        components: [],
      });
    } catch {
      // 메시지가 삭제됐거나 권한 문제면 무시
    }
  }, AUTO_CLOSE_MS);
}

// 새 세션 카드 보내기 (채팅 트리거용)
async function sendSession(channel) {
  const msg = await channel.send({
    embeds: [buildSessionEmbed([])],
    components: buildButtons(),
  });
  scheduleAutoClose(msg);
}

// 3개비 단위를 넘었으면 라플란드/켈시 멘트를 채널에 게시
async function maybeComment(channel, before, after) {
  if (!crossedThreshold(before, after)) return;
  const c = pickComment(after);
  try {
    await channel.send(`${c.emoji} **${c.who}**: ${c.line}`);
  } catch {
    // 전송 실패는 무시
  }
}

// 장시간 무흡연 시 축하 알림
async function checkNoSmoke() {
  const meta = getMeta();
  for (const [guildId, m] of Object.entries(meta)) {
    if (!m?.lastSmokeAt || m.alerted || !m.lastChannelId) continue;
    const gap = Date.now() - m.lastSmokeAt;
    if (gap < ALERT_HOURS * 3600 * 1000) continue;
    try {
      const ch = await client.channels.fetch(m.lastChannelId);
      const hours = Math.floor(gap / 3600000);
      await ch.send(`👏 벌써 **${hours}시간째** 아무도 담배를 안 피웠어요! 이 기세 그대로 가봅시다 💪`);
      markAlerted(guildId);
    } catch {
      // 채널 접근 실패는 무시
    }
  }
}

// ── 채팅 트리거 ──────────────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (TRIGGER.test(message.content)) {
    await sendSession(message.channel);
  }
});

// ── 상호작용(슬래시 커맨드 / 버튼 / 모달) ──────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1) 슬래시 커맨드
    if (interaction.isChatInputCommand()) {
      const g = interaction.guildId;
      switch (interaction.commandName) {
        case '담배': {
          await interaction.reply({
            embeds: [buildSessionEmbed([])],
            components: buildButtons(),
          });
          const msg = await interaction.fetchReply();
          scheduleAutoClose(msg);
          return;
        }
        case '오늘':
          await interaction.reply({
            embeds: [rankingEmbed('📊 오늘의 담배 순위', ranking(g, kstDayStart()))],
          });
          return;
        case '이번주':
          await interaction.reply({
            embeds: [rankingEmbed('📊 이번 주 담배 순위', ranking(g, kstWeekStart()))],
          });
          return;
        case '순위':
          await interaction.reply({
            embeds: [rankingEmbed('🏆 전체 누적 담배 순위', ranking(g, 0))],
          });
          return;
        case '내기록': {
          const target = interaction.options.getUser('대상') ?? interaction.user;
          const member = await interaction.guild.members.fetch(target.id).catch(() => null);
          const name = member?.displayName ?? target.username;
          const stats = {
            today: userTotal(g, target.id, kstDayStart()),
            week: userTotal(g, target.id, kstWeekStart()),
            month: userTotal(g, target.id, kstMonthStart()),
            all: userTotal(g, target.id, 0),
          };
          await interaction.reply({
            embeds: [myRecordEmbed(name, target.displayAvatarURL(), stats)],
          });
          return;
        }
      }
      return;
    }

    // 2) 버튼
    if (interaction.isButton()) {
      const [ns, action] = interaction.customId.split('|');
      if (ns !== 'smoke') return;

      const sessionId = interaction.message.id;

      if (action === 'modal') {
        await interaction.showModal(buildCountModal(sessionId));
        return;
      }

      if (action === 'cancel') {
        removeUser(sessionId, interaction.user.id);
        await interaction.update({
          embeds: [buildSessionEmbed(getSession(sessionId))],
          components: buildButtons(),
        });
        return;
      }

      // 1/2/3개비 버튼
      const count = Number(action);
      const before = sessionTotal(sessionId);
      setCount({
        sessionId,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        username: nameOf(interaction),
        count,
      });
      const after = sessionTotal(sessionId);
      if (count > 0) touchSmoke(interaction.guildId, interaction.channelId);

      await interaction.update({
        embeds: [buildSessionEmbed(getSession(sessionId))],
        components: buildButtons(),
      });
      await maybeComment(interaction.channel, before, after);
      return;
    }

    // 3) 모달 제출(직접입력)
    if (interaction.isModalSubmit()) {
      const [ns, kind, sessionId] = interaction.customId.split('|');
      if (ns !== 'smoke' || kind !== 'modal') return;

      const count = parseInt(interaction.fields.getTextInputValue('count'), 10);
      if (Number.isNaN(count) || count < 0 || count > 99) {
        await interaction.reply({
          content: '0~99 사이 숫자만 입력해주세요.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const before = sessionTotal(sessionId);
      setCount({
        sessionId,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        username: nameOf(interaction),
        count,
      });
      const after = sessionTotal(sessionId);
      if (count > 0) touchSmoke(interaction.guildId, interaction.channelId);

      // 원래 세션 카드 갱신
      try {
        const msg = await interaction.channel.messages.fetch(sessionId);
        await msg.edit({
          embeds: [buildSessionEmbed(getSession(sessionId))],
          components: buildButtons(),
        });
      } catch {
        // 원본 메시지를 못 찾으면 무시
      }

      await interaction.reply({
        content: `✅ ${count}개비로 기록했어요!`,
        flags: MessageFlags.Ephemeral,
      });
      await maybeComment(interaction.channel, before, after);
      return;
    }
  } catch (err) {
    console.error('상호작용 처리 오류:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
