# Deep Link 운영 가이드

이 문서는 `pick-one` 앱의 딥링크 전환(웹 -> 앱) 설정과 점검 항목을 정리합니다.

## 현재 기준 설정

- 앱 스킴: `pickone` (`app.json`의 `"scheme": "pickone"`)
- 앱 열기 URL: `pickone://`
- 웹 fallback URL 우선순위:
1. `EXPO_PUBLIC_APP_DOWNLOAD_URL`
2. `EXPO_PUBLIC_APP_URL`
3. `https://pickone.app`

## 필수 작업

1. 새 앱 빌드 배포
- `scheme` 설정이 반영된 최신 빌드를 설치해야 딥링크가 동작합니다.

2. 환경 변수 설정
- 로컬(`.env.local`)과 배포(EAS/호스팅) 환경에 아래 값을 동일하게 설정합니다.
- `EXPO_PUBLIC_APP_DOWNLOAD_URL=https://pick-one.expo.app/download`

3. fallback 페이지 준비
- `EXPO_PUBLIC_APP_DOWNLOAD_URL` 주소에 접속 시 앱 설치 안내/스토어 이동이 가능해야 합니다.

## 동작 방식

`handleCreateOwn`(결과 화면 CTA 클릭) 시:

1. 웹이면 `pickone://` 딥링크를 먼저 시도합니다.
2. 일정 시간 내 앱 전환이 감지되지 않으면 fallback URL로 이동합니다.
3. 앱(iOS/Android) 내부에서는 기존 라우팅(`router.push('/')`)으로 이동합니다.

## 테스트 체크리스트

1. 설치된 기기
- iOS Safari, Android Chrome에서 CTA 클릭 -> 앱 열림 확인

2. 미설치 기기
- iOS Safari, Android Chrome에서 CTA 클릭 -> fallback URL 이동 확인

3. 앱 내부 이동
- 앱에서 동일 CTA 클릭 시 홈 화면으로 정상 이동 확인

4. 배포 환경 확인
- 프로덕션 환경 변수(`EXPO_PUBLIC_APP_DOWNLOAD_URL`) 설정 여부 확인
- 최신 빌드 설치 후 재검증

## 트러블슈팅

1. 앱이 안 열리는 경우
- 최신 빌드 설치 여부 확인
- `app.json`의 `scheme` 값과 코드의 딥링크 스킴 일치 여부 확인 (`pickone://`)

2. fallback으로 바로 이동되는 경우
- 기기에 앱 미설치 상태일 수 있음
- 브라우저 정책 영향일 수 있으므로 Safari/Chrome 각각 확인

3. 특정 환경에서만 실패하는 경우
- 해당 환경의 `EXPO_PUBLIC_APP_DOWNLOAD_URL` 누락 여부 확인

