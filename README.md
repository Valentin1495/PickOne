# PickOne

친구들에게 사진 두 장 중 무엇이 더 나은지 빠르게 물어보고, 링크로 투표를 받아볼 수 있는 Expo 앱입니다.

## 핵심 흐름

1. 사진 A, B를 선택합니다.
2. 질문이나 제목을 입력합니다.
3. 대결을 생성합니다.
4. 공유 링크를 보내 투표를 받습니다.
5. 결과 화면에서 참여 수와 선택 비율을 확인합니다.

## 기술 스택

- Expo + React Native + expo-router
- TypeScript
- Supabase Database / Storage
- TanStack Query
- Zustand
- expo-image-picker

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채워 넣습니다.

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_APP_URL=https://YOUR_WEB_DOMAIN
```

설명:

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
- `EXPO_PUBLIC_APP_URL`: 공유 링크에 사용될 웹 주소

### 3. 개발 서버 실행

```bash
npm start
```

추가 명령:

```bash
npm run android
npm run ios
npm run web
```

## Supabase 설정

### 1. SQL 실행

Supabase SQL Editor에서 [lib/supabase.sql](c:/Users/user/pick-one/lib/supabase.sql) 내용을 실행합니다.

이 스크립트는 아래를 설정합니다.

- `battles` 테이블
- `votes` 테이블
- 테이블 RLS 정책
- `battle-images` Storage 버킷
- Storage RLS 정책

이미 정책이 있는 프로젝트에서도 다시 실행할 수 있게 idempotent하게 정리되어 있습니다.

### 2. Storage 확인

Supabase Storage에서 `battle-images` 버킷이 생성되어 있고 public 버킷으로 설정되어 있는지 확인합니다.

## Android 이미지 선택과 crop

현재 Android에서는 crop을 다시 사용할 수 있게 맞춰져 있습니다.

- 미리보기는 crop 결과가 안정적으로 보이도록 처리합니다.
- 업로드는 crop된 이미지 데이터를 사용해 Supabase Storage로 올립니다.

만약 Android에서 대결 생성 중 업로드가 실패하면, 먼저 Storage 버킷과 RLS 정책이 올바르게 적용됐는지 확인하는 것이 좋습니다.

## 공유 링크 형식

투표 링크는 아래 형식으로 만들어집니다.

```text
/web/b/{invite_token}
```

예:

```text
https://YOUR_WEB_DOMAIN/web/b/9saDbaSX
```

## EAS Hosting 사용

공유 링크를 EAS Hosting 주소로 연결하려면 Expo 웹 앱 전체를 빌드하고 배포해야 합니다.

중요한 점:

- [app/web/b/[token].tsx](c:/Users/user/pick-one/app/web/b/[token].tsx) 파일 하나만 따로 배포하는 방식이 아닙니다.
- `npx expo export --platform web`은 Expo 웹 앱 전체를 정적 빌드합니다.
- `eas deploy --prod`는 그 전체 웹 앱을 EAS Hosting에 배포합니다.
- 따라서 `/web/b/{invite_token}` 투표 페이지도 배포된 웹 앱의 한 라우트로 함께 올라갑니다.

배포 후 접근 가능한 대표 경로 예시:

- `/`
- `/web/b/{invite_token}`
- `/result/{battleId}`

예:

```text
https://YOUR_SUBDOMAIN.expo.app/web/b/9saDbaSX
```

### 1. 웹 앱 전체 빌드 / 배포

```bash
npx expo export --platform web
eas deploy --prod
```

배포가 끝나면 보통 아래 형식의 production URL을 받습니다.

```text
https://YOUR_SUBDOMAIN.expo.app
```

### 2. 환경 변수 업데이트

`.env.local`의 `EXPO_PUBLIC_APP_URL`을 위 production URL로 바꿉니다.

예:

```env
EXPO_PUBLIC_APP_URL=https://your-subdomain.expo.app
```

### 3. 개발 서버 재시작

```bash
npm start
```

이후 앱에서 생성되는 공유 링크는 EAS Hosting 주소를 사용합니다.

## 공유 UX 규칙

현재 공유 모달은 아래 규칙으로 동작합니다.

- 모달 바깥을 누르면 모달만 닫힙니다.
- `나중에 하기`를 누르면 모달만 닫힙니다.
- `공유 시트 열기`는 네이티브 공유 시트만 엽니다.
- 공유 시트를 취소해도 자동으로 결과 화면으로 이동하지 않습니다.
- `결과 보기`를 눌렀을 때만 결과 화면으로 이동합니다.

## 주요 파일

- [app/(tabs)/index.tsx](c:/Users/user/pick-one/app/(tabs)/index.tsx): 대결 생성 화면
- [components/image-picker-slot.tsx](c:/Users/user/pick-one/components/image-picker-slot.tsx): 이미지 선택 슬롯
- [components/share-modal.tsx](c:/Users/user/pick-one/components/share-modal.tsx): 공유 모달
- [app/web/b/[token].tsx](c:/Users/user/pick-one/app/web/b/[token].tsx): 웹 투표 페이지
- [app/result/[battleId].tsx](c:/Users/user/pick-one/app/result/[battleId].tsx): 결과 화면
- [services/battleService.ts](c:/Users/user/pick-one/services/battleService.ts): 이미지 업로드와 대결 생성
- [services/shareService.ts](c:/Users/user/pick-one/services/shareService.ts): 공유 링크와 공유 시트 처리
- [lib/supabase.sql](c:/Users/user/pick-one/lib/supabase.sql): DB와 Storage 정책 설정

## 확인 체크리스트

- `.env.local`의 값이 실제 Supabase 프로젝트와 웹 주소를 가리키는지
- `battle-images` 버킷이 존재하는지
- 최신 [lib/supabase.sql](c:/Users/user/pick-one/lib/supabase.sql)을 실행했는지
- 공유 링크가 올바른 도메인으로 생성되는지

## Deep Link Guide
- [docs/deeplink-guide.md](c:/Users/user/pick-one/docs/deeplink-guide.md)
