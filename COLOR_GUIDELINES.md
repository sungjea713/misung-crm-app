# 미성 E&C CRM - 색상 접근성 가이드라인

## 색상 대비 원칙

### WCAG 2.1 기준
- **일반 텍스트**: 최소 4.5:1 대비율
- **큰 텍스트 (18pt+ 또는 14pt+ bold)**: 최소 3:1 대비율
- **UI 컴포넌트 (버튼, 아이콘 등)**: 최소 3:1 대비율

### 프로젝트 색상 팔레트

```css
/* 배경 색상 */
--bg-dark: #1a1a1a       /* 메인 다크 배경 */
--bg-darker: #0f0f0f     /* 더 어두운 배경 */
--bg-card: #2d2d2d       /* 카드 배경 */

/* 프라이머리 색상 (그린) */
--primary: #4ade80       /* 밝은 그린 (대비율 낮음) */
--primary-dark: #22c55e  /* 중간 그린 */
--primary-hover: #3bc96a /* 호버 그린 */

/* 회색 톤 */
--gray-border: #3d3d3d
--gray-input: #333333
--gray-text: #9ca3af
--gray-text-light: #6b7280

/* 텍스트 */
--text-primary: #ffffff
--text-secondary: #d1d5db
```

## 색상 조합 규칙

### 1. 밝은 배경 (Primary Green)에는 어두운 텍스트

✅ **올바른 조합**
```css
/* 배경: #4ade80 (밝은 그린) */
/* 텍스트: #0f0f0f (다크) - 대비율 12.5:1 */
.btn-primary {
  background: #4ade80;
  color: #0f0f0f;
}
```

❌ **잘못된 조합**
```css
/* 배경: #4ade80 (밝은 그린) */
/* 텍스트: #ffffff (흰색) - 대비율 1.5:1 (너무 낮음) */
.btn-primary {
  background: #4ade80;
  color: #ffffff; /* 읽기 어려움 */
}
```

### 2. 어두운 배경에는 밝은 텍스트

✅ **올바른 조합**
```css
/* 배경: #2d2d2d (다크) */
/* 텍스트: #ffffff (흰색) - 대비율 12.6:1 */
.card {
  background: #2d2d2d;
  color: #ffffff;
}
```

### 3. 체크박스와 아이콘

✅ **올바른 방법**
```tsx
{/* 밝은 그린 배경 */}
<div className="bg-primary">
  {/* 어두운 아이콘 */}
  <CheckIcon className="text-bg-darker" />
</div>
```

❌ **잘못된 방법**
```tsx
{/* 밝은 그린 배경 */}
<div className="bg-primary">
  {/* 흰색 아이콘 - 보이지 않음 */}
  <CheckIcon className="text-white" />
</div>
```

## 컴포넌트별 가이드

### Primary 버튼
```css
.btn-primary {
  background: #4ade80;      /* 밝은 그린 */
  color: #0f0f0f;          /* 거의 검정색 텍스트 */
  font-weight: 600;        /* 가독성 향상 */
}

.btn-primary:hover {
  background: #3bc96a;      /* 약간 어두운 그린 */
  color: #0f0f0f;          /* 동일한 텍스트 색상 유지 */
}
```

### Secondary 버튼
```css
.btn-secondary {
  background: #2d2d2d;      /* 어두운 배경 */
  color: #ffffff;          /* 흰색 텍스트 */
  border: 1px solid #3d3d3d;
}

.btn-secondary:hover {
  background: #3d3d3d;      /* 약간 밝은 배경 */
  color: #ffffff;          /* 흰색 텍스트 유지 */
}
```

### 체크박스
```tsx
{/* 체크되지 않은 상태 */}
<div className="w-5 h-5 border-2 border-gray-border bg-transparent" />

{/* 체크된 상태 */}
<div className="w-5 h-5 bg-primary flex items-center justify-center">
  <Check className="w-4 h-4 text-bg-darker" /> {/* 어두운 체크 아이콘 */}
</div>
```

### 입력 필드
```css
.input-field {
  background: #333333;      /* 어두운 배경 */
  color: #ffffff;          /* 흰색 텍스트 */
  border: 1px solid #3d3d3d;
}

.input-field:focus {
  border-color: #4ade80;   /* 포커스 시 그린 테두리 */
}
```

### 링크와 강조
```css
/* 어두운 배경 위의 링크 */
.link-on-dark {
  color: #4ade80;          /* 그린 텍스트 */
}

/* 밝은 배경 위의 링크 */
.link-on-light {
  color: #22c55e;          /* 더 어두운 그린 */
}
```

## 색상 대비 검증 도구

### 온라인 도구
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

### 브라우저 개발자 도구
- Chrome DevTools: Elements → Accessibility → Contrast
- Firefox DevTools: Accessibility Inspector

## 새로운 색상 추가 시 체크리스트

- [ ] 배경색과 텍스트 색상의 대비율이 4.5:1 이상인가?
- [ ] 큰 텍스트/아이콘의 경우 3:1 이상인가?
- [ ] 색맹 시뮬레이터로 테스트했는가?
- [ ] 호버/포커스 상태도 충분한 대비를 유지하는가?
- [ ] 모바일 화면에서도 잘 보이는가?

## 실제 적용 예시

### 주간 계획 저장 버튼
```tsx
<button className="btn-primary flex items-center space-x-2">
  <Save size={20} className="text-bg-darker" />  {/* 어두운 아이콘 */}
  <span className="text-bg-darker font-semibold">저장</span>  {/* 어두운 텍스트 */}
</button>
```

### 새로 작성 버튼
```tsx
<button className="btn-primary flex items-center space-x-2">
  <Plus size={20} className="text-bg-darker" />
  <span className="text-bg-darker font-semibold">새로 작성</span>
</button>
```

### 체크박스 컴포넌트
```tsx
{isChecked ? (
  <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
    <Check size={16} className="text-bg-darker font-bold" />
  </div>
) : (
  <div className="w-5 h-5 border-2 border-gray-border rounded bg-transparent" />
)}
```

## 색상 변경 이력

### 2025-01-29 - 초기 색상 접근성 개선
- `.btn-primary` 텍스트 색상: `white` → `bg-darker` (대비율 1.5:1 → 12.5:1)
  - 위치: [src/frontend/styles/globals.css:21](src/frontend/styles/globals.css#L21)
  - 영향: 모든 Primary 버튼 (새로 작성, 저장, 로그인 등)
- 체크박스 체크 아이콘 색상: `text-white` → `text-bg-darker`
  - 위치: [src/frontend/components/WeeklyPlanForm.tsx:287,323,359](src/frontend/components/WeeklyPlanForm.tsx#L287)
  - 영향: 활동 구분 체크박스 (건설사 영업, 현장 추가 영업, 현장 지원)
- 버튼 폰트 굵기: `font-medium` → `font-semibold` (가독성 추가 향상)

---

이 가이드라인을 따라 모든 UI 컴포넌트에서 충분한 색상 대비를 유지하여 접근성과 가독성을 보장하세요.
