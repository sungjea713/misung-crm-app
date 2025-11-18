-- Add new users and update existing users
-- 새 사용자 2명 추가, 기존 사용자 2명 수정

-- 비밀번호 해시: "1234"
-- $2b$10$QvqyPVCnb7xMoi/hDwVyTe282fgod/83hcrbN/7tvKhpRlJFPEshK

-- 1. 새 사용자 2명 추가
INSERT INTO users (
  email,
  password_hash,
  name,
  department,
  site,
  position,
  phone,
  role,
  is_initial_password,
  auto_login
) VALUES
  -- 유상영 (부장, 관리자)
  (
    'sangyoung.yoo@mscrail.com',
    '$2b$10$QvqyPVCnb7xMoi/hDwVyTe282fgod/83hcrbN/7tvKhpRlJFPEshK',
    '유상영',
    'AD[영업]',
    '남동지점',
    '부장',
    '010-8818-1507',
    'admin',
    true,
    false
  ),
  -- 한기철 (전무, 관리자)
  (
    'kichul.han@mscrail.com',
    '$2b$10$QvqyPVCnb7xMoi/hDwVyTe282fgod/83hcrbN/7tvKhpRlJFPEshK',
    '한기철',
    'admin',
    '본점',
    '전무',
    '010-8240-1009',
    'admin',
    true,
    false
  );

-- 2. 정병규 사용자 권한 변경 (admin으로 승격)
UPDATE users
SET
  role = 'admin',
  updated_at = NOW()
WHERE name = '정병규';

-- 3. 박진주 사용자 정보 수정 (이메일 변경 및 비밀번호 초기화)
UPDATE users
SET
  email = 'jinju.park@mscrail.com',
  password_hash = '$2b$10$QvqyPVCnb7xMoi/hDwVyTe282fgod/83hcrbN/7tvKhpRlJFPEshK',
  is_initial_password = true,
  updated_at = NOW()
WHERE name = '박진주';

-- 4. 결과 확인 - 새로 추가/수정된 사용자
SELECT
  id,
  name,
  email,
  department,
  site,
  position,
  phone,
  role,
  is_initial_password,
  created_at
FROM users
WHERE name IN ('정병규', '유상영', '한기철', '박진주')
ORDER BY name;

-- 실행 후:
-- - 유상영, 한기철: 새로 추가됨 (비밀번호 "1234", 관리자 권한)
-- - 정병규: role을 admin으로 변경
-- - 박진주: 이메일 변경 (jinju.park@mscrail.com), 비밀번호 초기화 ("1234")
