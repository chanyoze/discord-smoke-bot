// 메인 봇.
//  - 채팅에 "담배 피실 분" 이 들어오면 자동으로 세션 카드 생성
//  - /담배 슬래시 커맨드로도 세션 생성
//  - 버튼(1/2/3개비, 직접입력, 참여취소)으로 집계
//  - /오늘 /이번주 /순위 로 통계 확인

import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
  MessageFlags,
} from 'discord.js';

import { setCount, removeUser, getSession, ranking } from './store.js';
import {
  buildButtons,
  buildSessionEmbed,
  buildCountModal,
  rankingEmbed,
} from './ui.js';
import { kstDayStart, kstWeekStart } from './time.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // "담배 피실 분" 자동 감지에 필요(포털에서 켜야 함)
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ 로그인 완료: ${c.user.tag}`);
});

// 표시명 얻기(서버 별명 우선)
function nameOf(interaction) {
  return interaction.member?.displayName ?? interaction.user.username;
}

// 채팅 트리거 패턴: "담배 피실/푸실/펴실/필 분" (띄어쓰기 유무 무관)
const TRIGGER = /담배\s*(피실|푸실|펴실|필)\s*분/;

// 새 세션 카드 보내기 (채팅 트리거용)
async function sendSession(channel) {
  await channel.send({
    embeds: [buildSessionEmbed([])],
    components: buildButtons(),
  });
}

// ── 채팅 트리거: "담배 피실 분" 포함 메시지 ──────────────
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
      switch (interaction.commandName) {
        case '담배':
          await interaction.reply({
            embeds: [buildSessionEmbed([])],
            components: buildButtons(),
          });
          return;
        case '오늘':
          await interaction.reply({
            embeds: [rankingEmbed('📊 오늘의 담배 순위', ranking(interaction.guildId, kstDayStart()))],
          });
          return;
        case '이번주':
          await interaction.reply({
            embeds: [rankingEmbed('📊 이번 주 담배 순위', ranking(interaction.guildId, kstWeekStart()))],
          });
          return;
        case '순위':
          await interaction.reply({
            embeds: [rankingEmbed('🏆 전체 누적 담배 순위', ranking(interaction.guildId, 0))],
          });
          return;
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
      } else {
        setCount({
          sessionId,
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          userId: interaction.user.id,
          username: nameOf(interaction),
          count: Number(action),
        });
      }

      await interaction.update({
        embeds: [buildSessionEmbed(getSession(sessionId))],
        components: buildButtons(),
      });
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

      setCount({
        sessionId,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        username: nameOf(interaction),
        count,
      });

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
      return;
    }
  } catch (err) {
    console.error('상호작용 처리 오류:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
