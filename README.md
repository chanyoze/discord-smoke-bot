# 🚬 담배 카운트 디스코드 봇

채팅방에 **"담배 피실 분?"** 이라고 치면 봇이 카드를 띄우고,
친구들이 버튼을 눌러 **누가 / 몇 개비** 폈는지 자동 집계합니다.

## 기능
- 채팅 `담배 피실 분?` 또는 `/담배` → 세션 카드 생성
- 버튼: `🚬 1개비` `🚬 2개비` `🚬 3개비` `✏️ 직접입력` `✖️ 참여취소`
- `/오늘` `/이번주` `/순위` → 한국 시간 기준 순위 집계

---

## 1. 디스코드 봇 만들기 (처음이면 이대로)

1. https://discord.com/developers/applications 접속 → **New Application** → 이름 입력
2. 왼쪽 **General Information** → **APPLICATION ID** 복사 → `.env` 의 `CLIENT_ID` 에 붙여넣기
3. 왼쪽 **Bot** 탭 →
   - **Reset Token** → 나온 토큰 복사 → `.env` 의 `DISCORD_TOKEN` 에 붙여넣기 (한 번만 보임!)
   - 아래로 스크롤 → **Privileged Gateway Intents** 에서
     **MESSAGE CONTENT INTENT** 를 **켜기(ON)** ← "담배 피실 분" 자동 감지에 필수
4. 왼쪽 **OAuth2 → URL Generator** →
   - SCOPES: `bot` , `applications.commands` 체크
   - BOT PERMISSIONS: `Send Messages`, `Embed Links`, `Read Message History` 체크
   - 맨 아래 생성된 URL 복사 → 브라우저에서 열기 → 봇을 내 서버에 초대
5. 디스코드 앱에서 **내 서버 아이콘 우클릭 → "서버 ID 복사"**
   (안 보이면: 사용자 설정 → 고급 → **개발자 모드 ON**)
   → `.env` 의 `GUILD_ID` 에 붙여넣기

## 2. 설치 & 실행

```powershell
# 프로젝트 폴더에서
npm install

# .env.example 을 복사해 .env 만들고 위에서 복사한 값 3개 채우기
copy .env.example .env

# 슬래시 커맨드 등록 (커맨드 추가/변경 시에만 다시 실행)
npm run deploy

# 봇 켜기
npm start
```

`✅ 로그인 완료: ...` 가 뜨면 성공. 디스코드에서 `담배 피실 분?` 쳐보세요!

## 데이터
- 모든 기록은 `data.json` 파일에 저장됩니다 (DB 설치 불필요).
- 봇을 끄면 집계가 멈추지만, 다시 켜면 기존 기록은 유지됩니다.
- ⚠️ 봇이 켜져 있어야 동작합니다. PC를 끄면 봇도 꺼져요.
