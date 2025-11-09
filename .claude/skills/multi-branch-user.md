# 다중 지점 사용자 처리 (Multi-Branch User Handling)

## 개요
송기정, 김태현 사용자는 본점과 인천 두 지점에서 근무하므로, 데이터 등록/수정 시 지점을 구분해야 합니다.

## 핵심 구현 패턴

### 1. 프론트엔드 폼 컴포넌트

모든 데이터 입력 폼(WeeklyPlanForm, SalesActivityForm, DailyPlanForm, InvoiceRecordForm 등)에서 다음 패턴을 따릅니다:

```typescript
// 1. 다중 지점 사용자 체크
const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';

// 2. 초기 지점 설정 함수 - created_by suffix로 판단
const getInitialBranch = (): '본점' | '인천' => {
  if (plan && isMultiBranchUser) {
    // created_by에 (In) suffix가 있으면 인천, 없으면 본점
    return plan.created_by?.includes('(In)') ? '인천' : '본점';
  }
  return user.branch || '인천';
};

const [selectedBranch, setSelectedBranch] = useState<'본점' | '인천'>(getInitialBranch());

// 3. useEffect로 plan/activity/record 변경 시 지점 업데이트
useEffect(() => {
  if (plan) {
    // ... formData 설정 ...

    // Update selected branch based on created_by suffix
    if (isMultiBranchUser) {
      setSelectedBranch(plan.created_by?.includes('(In)') ? '인천' : '본점');
    }
  } else {
    // Reset form for new entry
    // ... formData 리셋 ...

    // Reset branch to default for new entry
    if (isMultiBranchUser) {
      setSelectedBranch(user.branch || '인천');
    }
  }
}, [plan, isMultiBranchUser, user.branch]);

// 4. 저장 시 branch 정보 추가
const handleSubmit = async () => {
  const dataToSave = {
    ...formData,
    // 다중 지점 사용자인 경우 branch 정보 추가
    ...(isMultiBranchUser && { branch: selectedBranch }),
  };
  await onSave(dataToSave);
};

// 5. UI에 지점 선택 버튼 표시
{isMultiBranchUser && (
  <div>
    <label>지점 구분 *</label>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setSelectedBranch('본점')}
        className={selectedBranch === '본점' ? 'active' : ''}
      >
        본점
      </button>
      <button
        type="button"
        onClick={() => setSelectedBranch('인천')}
        className={selectedBranch === '인천' ? 'active' : ''}
      >
        인천
      </button>
    </div>
  </div>
)}
```

### 2. 백엔드 API 엔드포인트 (index.ts)

데이터를 생성/수정하는 API 엔드포인트에서 `created_by`와 `updated_by`를 제거합니다:

```typescript
// POST - 생성
const user = result.user;
const body = await req.json();
// Remove created_by and updated_by from body - these should be set by the function
const { created_by, updated_by, ...bodyWithoutAuditFields } = body;
const dataToInsert = {
  ...bodyWithoutAuditFields,
  user_id: user.id,
};

const createResult = await createFunction(dataToInsert, user.name);

// PUT - 수정
const user = result.user;
const body = await req.json();
// Remove created_by and updated_by from body
const { created_by, updated_by, ...bodyWithoutAuditFields } = body;

const updateResult = await updateFunction(id, bodyWithoutAuditFields, user.role, user.id, user.name);
```

### 3. 백엔드 비즈니스 로직 (서버 함수)

각 테이블의 create/update 함수에서 branch에 따라 이름 suffix를 추가합니다:

```typescript
export async function createFunction(data: DataType & { branch?: string }, userName: string) {
  // 다중 지점 사용자(송기정, 김태현)의 경우 branch에 따라 이름 suffix 추가
  let createdByName = userName;
  if ((userName === '송기정' || userName === '김태현') && data.branch) {
    if (data.branch === '인천') {
      createdByName = `${userName}(In)`;
    }
    // '본점'인 경우는 suffix 없이 그대로 사용
  }

  // branch 필드는 DB에 저장하지 않음 (created_by에 반영됨)
  const { branch, ...dataToInsert } = data;

  const { data: result, error } = await supabase
    .from('table_name')
    .insert({
      user_id: userId,
      ...dataToInsert,
      created_by: createdByName,
    })
    .select()
    .single();
}

export async function updateFunction(
  id: number,
  data: Partial<DataType> & { branch?: string },
  userRole: string,
  userId: string,
  userName: string
) {
  // 다중 지점 사용자(송기정, 김태현)의 경우 branch에 따라 이름 suffix 추가
  let updatedByName = userName;
  if ((userName === '송기정' || userName === '김태현') && data.branch) {
    if (data.branch === '인천') {
      updatedByName = `${userName}(In)`;
    }
    // '본점'인 경우는 suffix 없이 그대로 사용
  }

  // branch 필드는 DB에 저장하지 않음 (updated_by에 반영됨)
  const { branch, ...dataToUpdate } = data;

  const { data: result, error } = await supabase
    .from('table_name')
    .update({
      ...dataToUpdate,
      updated_by: updatedByName,
    })
    .eq('id', id)
    .select()
    .single();
}
```

### 4. TypeScript 인터페이스

데이터 인터페이스에서 `created_by`와 `updated_by`를 **제거**합니다:

```typescript
interface DataType {
  user_id: string;
  field1: string;
  field2: number;
  // Note: created_by and updated_by should NOT be in this interface
  // They are set by the create/update functions based on userName parameter
}
```

## 적용된 파일들

### 프론트엔드 폼
- `/src/frontend/components/WeeklyPlanForm.tsx` ✅
- `/src/frontend/components/SalesActivityForm.tsx` ✅
- `/src/frontend/components/DailyPlanForm.tsx` ✅
- `/src/frontend/components/InvoiceRecordForm.tsx` ✅

### 백엔드 서버 함수
- `/src/server/weekly-plans.ts` ✅
- `/src/server/sales-activities.ts` ✅
- `/src/server/daily-plans.ts` ✅
- `/src/server/invoice-records.ts` ✅

### API 엔드포인트
- `/src/server/index.ts` - 각 POST/PUT 엔드포인트 ✅

## 데이터베이스 저장 방식

- **본점**: `created_by = "송기정"` 또는 `"김태현"`
- **인천**: `created_by = "송기정(In)"` 또는 `"김태현(In)"`

## 주의사항

1. **새 기능 추가 시**: 데이터 입력/수정이 있는 모든 폼에 위 패턴을 적용해야 합니다.
2. **인터페이스 정의**: `created_by`와 `updated_by`는 서버 함수에서만 설정하므로 데이터 인터페이스에 포함하지 않습니다.
3. **API 엔드포인트**: 요청 body에서 `created_by`와 `updated_by`를 명시적으로 제거해야 합니다.
4. **지점 판단**: 수정 모드에서는 `created_by`에 `"(In)"` suffix가 있는지로 지점을 판단합니다.
5. **기본값**: 다중 지점 사용자의 기본 지점은 `user.branch` 또는 `'인천'`입니다.

## 트러블슈팅

### 문제: 수정 시 지점이 항상 인천으로 표시됨
**원인**: `selectedBranch` state가 `plan/activity/record`의 `created_by`를 확인하지 않음

**해결**:
1. `getInitialBranch()` 함수 추가
2. `useEffect`에서 plan 변경 시 `setSelectedBranch` 호출

### 문제: created_by가 NULL로 저장됨
**원인**:
1. 프론트엔드에서 `created_by: ''`를 보내고 있음
2. API 엔드포인트에서 이를 제거하지 않음
3. 인터페이스에 `created_by`가 포함되어 있음

**해결**:
1. API 엔드포인트에서 destructuring으로 제거: `const { created_by, updated_by, ...rest } = body`
2. 인터페이스에서 `created_by`, `updated_by` 제거
3. 서버 함수에서 `userName` 파라미터로 받아서 설정
