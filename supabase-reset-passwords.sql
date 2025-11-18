-- Reset passwords for all users except 김성재 and 박진주
-- 비밀번호를 초기 비밀번호 "1234"로 재설정
-- 실행 전 반드시 현재 사용자 목록을 확인하세요!

-- 1. 먼저 현재 사용자 목록 확인 (실행 전 검토용)
SELECT id, name, email, department, is_initial_password
FROM users
ORDER BY name;

-- 2. 비밀번호 초기화 대상 사용자 확인 (김성재, 박진주 제외)
SELECT id, name, email, department
FROM users
WHERE name NOT IN ('김성재', '박진주')
ORDER BY name;

-- 3. 비밀번호 초기화 실행
-- 초기 비밀번호: "1234"
-- 해시값: $2b$10$QvqyPVCnb7xMoi/hDwVyTe282fgod/83hcrbN/7tvKhpRlJFPEshK

UPDATE users
SET
  password_hash = '$2b$10$QvqyPVCnb7xMoi/hDwVyTe282fgod/83hcrbN/7tvKhpRlJFPEshK',
  is_initial_password = true,
  updated_at = NOW()
WHERE name NOT IN ('김성재', '박진주');

-- 4. 결과 확인
SELECT
  id,
  name,
  email,
  department,
  is_initial_password,
  updated_at
FROM users
ORDER BY name;

-- 실행 후:
-- - 김성재, 박진주: 기존 비밀번호 유지
-- - 기타 사용자: 비밀번호 "1234"로 초기화, 다음 로그인 시 변경 요구됨
