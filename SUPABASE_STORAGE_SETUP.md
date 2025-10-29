# Supabase Storage 설정 가이드

영업 활동 사진 업로드 기능을 위한 Supabase Storage 설정 방법입니다.

## 1. Storage Bucket 생성

### 1-1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://app.supabase.com/)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **Storage** 클릭

### 1-2. 새 Bucket 생성
1. **"New bucket"** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `sales-activity-images`
   - **Public bucket**: ✅ 체크 (공개 접근 허용)
   - **File size limit**: `5242880` (5MB = 5 * 1024 * 1024 bytes)
   - **Allowed MIME types**:
     ```
     image/jpeg
     image/png
     image/webp
     image/heic
     ```
     (각 줄마다 하나씩 입력)
3. **"Create bucket"** 클릭

## 2. Row Level Security (RLS) 정책 설정

Storage bucket에 대한 접근 권한을 설정합니다.

### 2-1. SQL Editor 접속
1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **"New query"** 클릭

### 2-2. RLS 정책 SQL 실행

다음 SQL을 복사하여 붙여넣고 **"Run"** 클릭:

```sql
-- 1. 인증된 사용자가 자신의 폴더에 파일 업로드 허용
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sales-activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. 모든 사용자가 파일 읽기 허용 (공개 버킷)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'sales-activity-images');

-- 3. 인증된 사용자가 자신의 파일 업데이트 허용
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sales-activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'sales-activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. 인증된 사용자가 자신의 파일 삭제 허용
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'sales-activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Admin 사용자는 모든 파일 삭제 가능 (선택사항)
CREATE POLICY "Admins can delete any file"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'sales-activity-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

## 3. 설정 확인

### 3-1. Bucket 확인
1. **Storage** 메뉴로 돌아가기
2. `sales-activity-images` bucket이 생성되었는지 확인
3. Bucket 클릭하여 설정 확인:
   - Public: ✅
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp, image/heic

### 3-2. 정책 확인
1. **Storage** 메뉴에서 `sales-activity-images` bucket 선택
2. **"Policies"** 탭 클릭
3. 다음 정책들이 생성되었는지 확인:
   - Users can upload to their own folder (INSERT)
   - Public read access (SELECT)
   - Users can update their own files (UPDATE)
   - Users can delete their own files (DELETE)
   - Admins can delete any file (DELETE)

## 4. 애플리케이션 설정

환경 변수가 올바르게 설정되어 있는지 확인:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

## 5. 파일 구조

업로드된 파일은 다음과 같은 구조로 저장됩니다:

```
sales-activity-images/
├── {user_id_1}/
│   ├── 1234567890-abc123.jpg
│   ├── 1234567891-def456.png
│   └── ...
├── {user_id_2}/
│   ├── 1234567892-ghi789.jpg
│   └── ...
└── ...
```

- 각 사용자의 파일은 사용자 ID 폴더에 저장
- 파일명 형식: `{timestamp}-{random}.{extension}`
- 이를 통해 파일명 충돌 방지 및 사용자별 권한 관리

## 6. 테스트

### 6-1. 업로드 테스트
1. 애플리케이션에서 **실적 입력 > 영업 활동** 메뉴로 이동
2. **"새 활동 등록"** 클릭
3. 사진 업로드 영역에서 이미지 파일 선택
4. 업로드 성공 확인

### 6-2. Storage에서 확인
1. Supabase Dashboard의 **Storage** 메뉴로 이동
2. `sales-activity-images` bucket 클릭
3. 사용자 ID 폴더 내에 파일이 업로드되었는지 확인

### 6-3. 삭제 테스트
1. 업로드한 사진 우측의 ❌ 버튼 클릭
2. 사진이 미리보기에서 제거되는지 확인
3. Supabase Storage에서도 파일이 삭제되었는지 확인

## 7. 문제 해결

### 업로드가 안 될 때
- 브라우저 콘솔에서 오류 메시지 확인
- Supabase 환경 변수가 올바른지 확인
- RLS 정책이 올바르게 설정되었는지 확인
- 파일 크기가 5MB 이하인지 확인
- 파일 형식이 허용된 이미지 형식인지 확인

### 파일이 보이지 않을 때
- Public bucket으로 설정되었는지 확인
- "Public read access" 정책이 활성화되었는지 확인
- 브라우저 캐시 삭제 후 새로고침

### 삭제가 안 될 때
- 사용자의 인증 토큰이 유효한지 확인
- "Users can delete their own files" 정책이 올바른지 확인
- 관리자 계정으로 로그인했는지 확인 (관리자는 모든 파일 삭제 가능)

## 8. 추가 설정 (선택사항)

### 8-1. 이미지 최적화
Supabase는 자동 이미지 변환을 지원합니다. URL에 파라미터를 추가하여 사용:

```typescript
// 예시: 썸네일 생성 (width 200px)
const thumbnailUrl = `${publicUrl}?width=200`;

// 예시: WebP 포맷으로 변환
const webpUrl = `${publicUrl}?format=webp`;
```

### 8-2. CDN 캐싱
Supabase Storage는 기본적으로 CDN을 사용합니다. 캐시 제어 헤더는 업로드 시 설정:

```typescript
const { data, error } = await supabase.storage
  .from('sales-activity-images')
  .upload(filePath, file, {
    cacheControl: '3600', // 1시간 캐싱
    upsert: false,
  });
```

## 9. 보안 권장사항

1. **환경 변수 보호**: `.env` 파일을 Git에 커밋하지 마세요
2. **파일 크기 제한**: 현재 5MB로 설정되어 있으며, 필요시 조정 가능
3. **파일 형식 제한**: 이미지 파일만 허용하도록 설정되어 있음
4. **사용자별 폴더 분리**: 각 사용자는 자신의 폴더에만 접근 가능
5. **주기적인 정책 검토**: RLS 정책이 올바르게 작동하는지 정기적으로 확인

## 참고 자료

- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage RLS 정책 예제](https://supabase.com/docs/guides/storage/security/access-control)
