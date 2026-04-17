---
url: 'https://developers-apps-in-toss.toss.im/user-hash-key/intro.md'
description: '유저 식별키 발급 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.'
---

# 이해하기

유저 식별키 발급은 사용자의 동의 절차 없이도 바로 서비스를 사용할 수 있게 해요.

---

## 유저 식별키 발급이란 무엇인가요

유저 식별키 발급은 별도의 서버를 만들지 않아도, 그리고 사용자 동의 절차 없이도 사용자를 식별할 수 있도록 돕는 기능이에요.\
동의 과정 없이 사용자가 즉시 서비스를 시작할 수 있도록 유저 식별키 발급 기능을 제공해요.

| **구분**       | **토스 로그인** | **유저 식별키 발급**                   |
| -------------- | --------------- | -------------------------------------- |
| 사용 가능 대상 | 모든 제휴사     | 모든 미니앱                            |
| 사용 함수      | `appLogin`      | `getUserKeyForGame`, `getAnonymousKey` |
| 서버 구축 필요 | 필요            | 불필요                                 |
| 콘솔 설정      | 필요            | 불필요                                 |
| 유저 동의      | 필요            | 불필요                                 |

---

## 유저 식별키 발급을 사용하면 어떤 점이 좋나요

- 서버 간 연동이 필요 없어요.
- 미니앱 안에서 사용자를 안정적으로 식별할 수 있어요.

---

## 참고해 주세요

- 게임 미니앱은 [`getUserKeyForGame`](/bedrock/reference/framework/게임/getUserKeyForGame.html)을, 비게임 미니앱은 [`getAnonymousKey`](/bedrock/reference/framework/비게임/getAnonymousKey.html)를 사용해 주세요.
- 토스 로그인에 대한 자세한 내용은 [가이드 문서](/login/intro.html)를 참고해 주세요.

---

url: 'https://developers-apps-in-toss.toss.im/user-hash-key/develop.md'
description: '유저 식별키 발급 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.'

---

# 개발하기

**SDK를 통해 연동해 주세요.**

미니앱 유형에 따라 사용하는 함수가 달라요.

| 미니앱 유형 | 함수                | 설명                                       |
| ----------- | ------------------- | ------------------------------------------ |
| 게임        | `getUserKeyForGame` | 게임 미니앱 전용 유저 식별키를 반환해요.   |
| 비게임      | `getAnonymousKey`   | 비게임 미니앱 전용 유저 식별키를 반환해요. |

두 함수 모두 서버 연동 없이 유저를 식별할 수 있는 **고유 키 값(hash)** 을 반환해요.\
반환되는 유저 식별자는 미니앱별로 고유해요.

## 게임 미니앱

`getUserKeyForGame` 함수를 사용해 유저 식별키를 발급받을 수 있어요.

자세한 내용은 [getUserKeyForGame](/bedrock/reference/framework/게임/getUserKeyForGame.md) 페이지를 확인해주세요.

::: tip 주의하세요

- 이 함수는 **게임 카테고리 미니앱에서만** 사용할 수 있어요.\
  비게임 카테고리에서 호출하면 오류가 발생해요.
- **SDK 1.4.0 이상 버전, 토스앱 5.232.0 이상 버전**에서 지원돼요.\
  그 이하 버전에서는 `undefined`를 반환해요.
- 유저 식별자는 **내부 유저 식별용 키**로만 사용되며, 해당 키로 **토스 서버에 직접 요청할 수 없어요.**
- 샌드박스에서는 mock 데이터가 내려가고 있어, QR 코드로 테스트를 부탁드려요.
  :::

## 비게임 미니앱

`getAnonymousKey` 함수를 사용해 유저 식별키를 발급받을 수 있어요.

자세한 내용은 [getAnonymousKey](/bedrock/reference/framework/비게임/getAnonymousKey.md) 페이지를 확인해주세요.

::: tip 주의하세요

- 이 함수는 **비게임 카테고리 미니앱에서만** 사용할 수 있어요.
- **SDK 2.4.5 이상 버전**에서 지원돼요. 그 이하 버전에서는 `undefined`를 반환해요.
- 유저 식별자는 **내부 유저 식별용 키**로만 사용되며, 해당 키로 **토스 서버에 직접 요청할 수 없어요.**
- 샌드박스에서는 mock 데이터가 내려가고 있어, QR 코드로 테스트를 부탁드려요.
  :::

---

url: >-
https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/getAnonymousKey.md

---

# 유저 식별키 발급 (`getAnonymousKey`) - 비게임

`getAnonymousKey`는 비게임 미니앱에서 유저를 식별하기 위한 API예요.\
토스 로그인처럼 별도의 인증 화면이나 서버 연동 없이, 미니앱 내부에서 고유한 유저 식별자를 바로 얻을 수 있어요.

이 함수는 **비게임 카테고리 미니앱에서만 사용 가능**하며, 반환되는 유저 식별자(`hash`)는 **미니앱별로 고유**해요.

::: tip 주의하세요

- 이 함수는 **비게임 카테고리 미니앱에서만 사용 가능**해요. 게임 미니앱에서 호출하면 `'INVALID_CATEGORY'`를 반환해요.
- **SDK 2.4.5 이상**에서 지원돼요. 그 이하 버전에서는 `undefined`를 반환해요.
- 반환되는 유저 키는 **토스 서버 API 호출용 키가 아니에요.**
  - 내부 유저 식별, 데이터 관리 용도로만 사용해 주세요.
- 샌드박스 환경에서는 **mock 데이터**가 내려와요. 실제 동작은 QR 코드로 토스앱에서 테스트해 주세요.
  :::

## 시그니처

```typescript
function getAnonymousKey(): Promise<
  GetAnonymousKeySuccessResponse | 'INVALID_CATEGORY' | 'ERROR' | undefined
>;
```

### 반환 값

사용자 키 조회 결과를 반환해요.

- `GetAnonymousKeySuccessResponse`: 사용자 키 조회에 성공했어요. `{ type: 'HASH', hash: string }` 형태로 반환돼요.
  - `hash` 값은 해당 미니앱에서만 유효한 유저 식별자예요.
- `'INVALID_CATEGORY'`: 비게임 카테고리가 아닌 미니앱에서 호출했어요.
- `'ERROR'`: 알 수 없는 오류가 발생했어요.
- `undefined`: SDK 버전이 최소 지원 버전보다 낮아요.

## 예제 : 유저 식별자 가져오기

아래 예제는 비게임 미니앱에서 `getAnonymousKey`를 호출해 유저 식별자를 받아 처리하는 기본적인 흐름을 보여줘요.

::: code-group

```js [js]
import { getAnonymousKey } from '@apps-in-toss/web-framework';

async function handleGetUserKey() {
  const result = await getAnonymousKey();

  if (!result) {
    console.warn('지원하지 않는 SDK 버전이에요.');
  } else if (result === 'INVALID_CATEGORY') {
    console.error('비게임 카테고리가 아닌 미니앱이에요.');
  } else if (result === 'ERROR') {
    console.error('사용자 키 조회 중 오류가 발생했어요.');
  } else if (result.type === 'HASH') {
    console.log('사용자 키:', result.hash);
    // 여기에서 사용자 키를 사용해 데이터를 관리할 수 있어요.
  }
}
```

```tsx [React]
// webview
import { getAnonymousKey } from '@apps-in-toss/web-framework';

function UserKeyButton() {
  async function handleClick() {
    const result = await getAnonymousKey();

    if (!result) {
      console.warn('지원하지 않는 SDK 버전이에요.');
      return;
    }

    if (result === 'INVALID_CATEGORY') {
      console.error('비게임 카테고리가 아닌 미니앱이에요.');
      return;
    }

    if (result === 'ERROR') {
      console.error('사용자 키 조회 중 오류가 발생했어요.');
      return;
    }

    if (result.type === 'HASH') {
      console.log('사용자 키:', result.hash);
      // 여기에서 사용자 키를 사용해 데이터를 관리할 수 있어요.
    }
  }

  return <button onClick={handleClick}>유저 키 가져오기</button>;
}
```

```tsx [React Native]
// react-native
import { Button } from 'react-native';
import { getAnonymousKey } from '@apps-in-toss/framework';

function UserKeyButton() {
  async function handlePress() {
    const result = await getAnonymousKey();

    if (!result) {
      console.warn('지원하지 않는 SDK 버전이에요.');
      return;
    }

    if (result === 'INVALID_CATEGORY') {
      console.error('비게임 카테고리가 아닌 미니앱이에요.');
      return;
    }

    if (result === 'ERROR') {
      console.error('사용자 키 조회 중 오류가 발생했어요.');
      return;
    }

    if (result.type === 'HASH') {
      console.log('사용자 키:', result.hash);
      // 여기에서 사용자 키를 사용해 데이터를 관리할 수 있어요.
    }
  }

  return <Button onPress={handlePress} title="유저 키 가져오기" />;
}
```

:::

## 참고사항

- `getAnonymousKey`는 비게임 미니앱 전용 유저 식별 수단이에요.
- 토스 로그인(`appLogin`)과 달리 서버 API 연동 없이도 사용할 수 있어요.
- 유저 데이터는 이 유저 키를 기준으로 관리하는 것을 권장해요.
