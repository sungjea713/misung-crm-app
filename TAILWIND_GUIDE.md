# Tailwind CSS 사용 가이드

이 문서는 미성 E&C CRM 프로젝트의 Tailwind CSS 설정과 사용 방법을 설명합니다.

## 버전 정보

- **Tailwind CSS**: v3.4.0
- **PostCSS**: v8.4.32
- **Autoprefixer**: v10.4.16

## 설치 및 설정

### 1. 패키지 설치

```bash
# Bun을 사용한 설치
bun add -d tailwindcss@^3.4.0 postcss@^8.4.32 autoprefixer@^10.4.16
```

### 2. 설정 파일 구조

프로젝트에는 다음 3개의 설정 파일이 필요합니다:

#### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,tsx,ts,jsx,js}",  // Tailwind가 스캔할 파일 경로
  ],
  theme: {
    extend: {
      colors: {
        // 커스텀 색상 정의 (아래 커스텀 색상 시스템 참조)
      },
    },
  },
  plugins: [],
}
```

#### `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### `src/frontend/styles/globals.css`
```css
@tailwind base;       /* Tailwind 기본 스타일 */
@tailwind components; /* Tailwind 컴포넌트 클래스 */
@tailwind utilities;   /* Tailwind 유틸리티 클래스 */

/* 커스텀 스타일은 @layer 지시문 사용 */
```

## 커스텀 색상 시스템

이 프로젝트는 다크 테마 기반의 커스텀 색상 팔레트를 사용합니다:

### 배경 색상
- `bg-dark`: #1a1a1a - 일반 다크 배경
- `bg-darker`: #0f0f0f - 더 어두운 배경 (body 기본)
- `bg-card`: #2d2d2d - 카드 컴포넌트 배경

### 주 색상 (Primary)
- `primary`: #4ade80 - 메인 그린 색상
- `primary-dark`: #22c55e - 어두운 그린
- `primary-hover`: #3bc96a - 호버 상태 그린

### 회색 계열
- `gray-border`: #3d3d3d - 테두리 색상
- `gray-input`: #333333 - 입력 필드 배경
- `gray-text`: #9ca3af - 보조 텍스트
- `gray-text-light`: #6b7280 - 밝은 보조 텍스트

### 텍스트 색상
- `text-primary`: #ffffff - 메인 텍스트 (흰색)
- `text-secondary`: #d1d5db - 보조 텍스트

## 커스텀 컴포넌트 클래스

프로젝트에서 자주 사용되는 UI 패턴을 위한 커스텀 클래스들:

### 버튼
```css
.btn-primary {
  @apply bg-primary hover:bg-primary-hover text-bg-darker
         font-semibold py-2 px-4 rounded transition-colors
         active:scale-95 touch-manipulation;
}

.btn-secondary {
  @apply bg-bg-card hover:bg-gray-border text-text-primary
         font-medium py-2 px-4 rounded transition-colors
         border border-gray-border active:scale-95 touch-manipulation;
}
```

### 입력 필드
```css
.input-field {
  @apply w-full bg-gray-input text-text-primary border
         border-gray-border rounded px-3 py-2
         focus:outline-none focus:border-primary
         transition-colors text-base;
}
```

### 카드 컴포넌트
```css
.card {
  @apply bg-bg-card rounded-lg p-4 sm:p-6
         border border-gray-border;
}
```

### 페이지 레이아웃
```css
.page-container {
  @apply p-4 sm:p-6 h-full overflow-auto;
}

.page-title {
  @apply text-xl sm:text-2xl font-bold text-white mb-4;
}

.page-description {
  @apply text-gray-text mb-4 sm:mb-6 text-sm sm:text-base;
}
```

## React/TypeScript에서 사용 예시

### 1. 기본 사용법
```tsx
// 유틸리티 클래스 직접 사용
<div className="bg-bg-darker text-text-primary p-4">
  <h1 className="text-2xl font-bold mb-4">제목</h1>
  <button className="bg-primary hover:bg-primary-hover px-4 py-2 rounded">
    버튼
  </button>
</div>
```

### 2. 커스텀 컴포넌트 클래스 사용
```tsx
// globals.css에 정의된 커스텀 클래스 사용
<div className="card">
  <input className="input-field" placeholder="입력하세요" />
  <button className="btn-primary">저장</button>
  <button className="btn-secondary">취소</button>
</div>
```

### 3. 반응형 디자인
```tsx
// Tailwind의 반응형 프리픽스 사용 (sm:, md:, lg:, xl:)
<div className="p-4 sm:p-6 md:p-8">
  <h1 className="text-xl sm:text-2xl md:text-3xl">
    반응형 제목
  </h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* 그리드 아이템 */}
  </div>
</div>
```

### 4. 조건부 스타일링
```tsx
// 동적 클래스 적용
const Button = ({ variant, disabled }: Props) => {
  const baseClasses = "px-4 py-2 rounded transition-colors";
  const variantClasses = {
    primary: "bg-primary hover:bg-primary-hover text-bg-darker",
    secondary: "bg-bg-card hover:bg-gray-border text-text-primary border border-gray-border"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      버튼
    </button>
  );
};
```

## 모바일 최적화

### 터치 디바이스 대응
```css
/* hover 효과가 없는 터치 디바이스에서 호버 스타일 비활성화 */
@media (hover: none) {
  .hover\:bg-gray-border:hover {
    @apply bg-bg-card;
  }
}

/* 탭 하이라이트 제거 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 터치 피드백을 위한 active 상태 */
.touch-manipulation {
  touch-action: manipulation;
}
```

## 커스텀 스크롤바

다크 테마에 맞는 커스텀 스크롤바 스타일:

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}
```

## 애니메이션

### 커스텀 애니메이션 정의
```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

## 빌드 및 최적화

### Vite와 함께 사용
프로젝트는 Vite를 사용하여 빌드되며, Tailwind CSS는 PostCSS 플러그인으로 처리됩니다:

1. **개발 모드**: 모든 Tailwind 유틸리티 클래스 사용 가능
2. **프로덕션 빌드**: 사용되지 않는 스타일 자동 제거 (PurgeCSS)

```json
{
  "scripts": {
    "dev": "bun --hot src/server/index.ts",
    "build": "vite build"
  }
}
```

## 유용한 팁

### 1. 클래스 정리
긴 클래스 목록은 가독성을 위해 그룹으로 나누어 작성:
```tsx
<div className={`
  // 레이아웃
  flex flex-col items-center justify-center
  // 스페이싱
  p-4 sm:p-6 md:p-8
  // 스타일링
  bg-bg-card rounded-lg border border-gray-border
  // 상태
  hover:bg-gray-border transition-colors
`}>
```

### 2. @apply 사용 시 주의사항
- 재사용 가능한 컴포넌트 클래스에만 사용
- 단순한 스타일 조합은 HTML에서 직접 클래스 나열
- 성능을 위해 과도한 @apply 사용 자제

### 3. 다크 모드 전용 프로젝트
이 프로젝트는 다크 모드만 지원하므로 `dark:` 프리픽스는 사용하지 않습니다.

### 4. TypeScript 자동완성
VSCode 사용 시 Tailwind CSS IntelliSense 확장 설치로 자동완성 지원:
```bash
code --install-extension bradlc.vscode-tailwindcss
```

## 디버깅

### 클래스가 적용되지 않을 때
1. `tailwind.config.js`의 content 경로 확인
2. 클래스명 오타 확인
3. 동적 클래스 생성 시 전체 클래스명 사용
   ```tsx
   // ❌ 잘못된 예
   const color = 'primary';
   <div className={`bg-${color}`}> // 작동하지 않음

   // ✅ 올바른 예
   const bgClass = 'bg-primary';
   <div className={bgClass}> // 작동함
   ```

### 빌드 시 스타일 누락
- PurgeCSS가 동적 클래스를 감지하지 못할 수 있음
- safelist에 클래스 추가 또는 전체 클래스명 사용

## 참고 링크

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/guides/vite)
- [PostCSS 설정](https://postcss.org/)