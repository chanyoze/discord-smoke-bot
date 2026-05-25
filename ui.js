// 세션 메시지의 임베드(보기 좋은 카드)와 버튼들을 만드는 곳.

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

const COLOR = 0xe67e22; // 주황색
const CLOSED_COLOR = 0x95a5a6; // 회색(마감)

// 개비 수 → 돈 환산 문자열. 기본 225원/개비 (한 갑 20개비 ≈ 4,500원 기준)
function won(count) {
  const price = Number(process.env.PRICE_PER_CIG || 225);
  return (count * price).toLocaleString('ko-KR') + '원';
}

// 세션 메시지에 붙는 버튼들
export function buildButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('smoke|1').setLabel('🚬 1개비').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('smoke|2').setLabel('🚬 2개비').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('smoke|3').setLabel('🚬 3개비').setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('smoke|modal').setLabel('✏️ 직접입력').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('smoke|cancel').setLabel('✖️ 참여취소').setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
}

function participantList(records) {
  return records.length
    ? records
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((r) => `• ${r.username} — **${r.count}**개비`)
        .join('\n')
    : '_아직 참여자가 없어요. 아래 버튼을 눌러주세요!_';
}

// 세션 카드(누가 몇 개비인지 + 총합 + 담배값)
export function buildSessionEmbed(records) {
  const total = records.reduce((s, r) => s + r.count, 0);
  return new EmbedBuilder()
    .setTitle('🚬 담배 피실 분?')
    .setDescription(
      `피우신 만큼 버튼을 눌러주세요! _(3분 뒤 자동 마감)_\n\n**참여자 (${records.length}명)**\n${participantList(records)}`
    )
    .addFields(
      { name: '총 개비 수', value: `**${total}** 개비`, inline: true },
      { name: '담배값', value: `약 **${won(total)}**`, inline: true }
    )
    .setColor(COLOR)
    .setTimestamp();
}

// 마감된 세션 카드(버튼 제거됨)
export function buildClosedEmbed(records) {
  const total = records.reduce((s, r) => s + r.count, 0);
  const list = records.length ? participantList(records) : '_참여자가 없었어요._';
  return new EmbedBuilder()
    .setTitle('🚬 담배 타임 (마감)')
    .setDescription(`이번 담배 타임은 마감됐어요.\n\n**참여자 (${records.length}명)**\n${list}`)
    .addFields(
      { name: '총 개비 수', value: `**${total}** 개비`, inline: true },
      { name: '담배값', value: `약 **${won(total)}**`, inline: true }
    )
    .setColor(CLOSED_COLOR)
    .setTimestamp();
}

// 개비 수 직접 입력 모달 (sessionId를 customId에 실어 보냄)
export function buildCountModal(sessionId) {
  const modal = new ModalBuilder()
    .setCustomId(`smoke|modal|${sessionId}`)
    .setTitle('개비 수 직접 입력');

  const input = new TextInputBuilder()
    .setCustomId('count')
    .setLabel('몇 개비 피웠나요? (숫자만)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(3);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

// 순위 카드 (개비 수 + 담배값)
export function rankingEmbed(title, rows) {
  const medals = ['🥇', '🥈', '🥉'];
  const body = rows.length
    ? rows
        .map(
          (r, i) =>
            `${medals[i] ?? `**${i + 1}.**`} ${r.username} — **${r.total}**개비 (${won(r.total)})`
        )
        .join('\n')
    : '_아직 기록이 없어요._';
  const total = rows.reduce((s, r) => s + r.total, 0);
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(body)
    .addFields({ name: '합계', value: `**${total}** 개비 · 약 **${won(total)}**`, inline: true })
    .setColor(COLOR)
    .setTimestamp();
}

// 개인 기록 카드(오늘/이번주/이번달/누적 + 담배값)
export function myRecordEmbed(name, avatarURL, stats) {
  const { today, week, month, all } = stats;
  return new EmbedBuilder()
    .setTitle(`📖 ${name} 님의 담배 기록`)
    .setThumbnail(avatarURL ?? null)
    .addFields(
      { name: '오늘', value: `**${today}**개비\n${won(today)}`, inline: true },
      { name: '이번 주', value: `**${week}**개비\n${won(week)}`, inline: true },
      { name: '이번 달', value: `**${month}**개비\n${won(month)}`, inline: true },
      { name: '누적', value: `**${all}**개비 · 약 **${won(all)}**`, inline: false }
    )
    .setColor(COLOR)
    .setTimestamp();
}
