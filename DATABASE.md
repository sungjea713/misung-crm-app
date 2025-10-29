현재 작업한 4가지 데이터베이스 테이블에 대한 상세 명세서를 작성하겠습니다.
미성 E&C ERP 데이터베이스 명세서
개요
데이터베이스: Supabase PostgreSQL
Supabase URL: https://dmyhhbvhbpwwtrmequop.supabase.co
동기화 주기: 순환 실행 (현장관리 → 매출 → 매입 → 현장요약 → 반복)
데이터 소스: SmartWiz ERP 시스템
1. construction_management (현장관리)
테이블 설명
건설 프로젝트의 전반적인 관리 정보를 저장하는 테이블
컬럼 명세
컬럼명	데이터 타입	Null 허용	설명	원본 CSV 컬럼명
id	BIGSERIAL	NO	기본 키 (자동 증가)	-
cms	TEXT	YES	CMS 코드	CMS
site_name	TEXT	YES	현장명	현장명
site_address	TEXT	YES	현장 주소	현장주소
client	TEXT	YES	고객사명	고객사
department	TEXT	YES	담당 부서	담당부서
sales_manager	TEXT	YES	영업 담당자	영업담당
construction_manager	TEXT	YES	시공 담당자	시공담당
order_month	TEXT	YES	수주 월	수주월
order_amount	NUMERIC	YES	수주 금액	수주금액
item_count	NUMERIC	YES	품목 수	품목수
total_contract_amount	INTEGER	YES	총 계약 금액	총계약금액
execution_amount	NUMERIC	YES	실행 금액	실행금액
execution_rate	NUMERIC	YES	실행율 (%)	실행율
start_date	TEXT	YES	시작일	시작
end_date	TEXT	YES	종료일	종료
status	TEXT	YES	현장 상태	상태
registration	TEXT	YES	등록 정보	등록
registration_date	TEXT	YES	등록일	등록일
approval_date	TEXT	YES	결재일	결재일
completion_date	NUMERIC	YES	완료일	완료일
notes	TEXT	YES	참고사항	참고사항
synced_at	TIMESTAMPTZ	NO	동기화 시각 (기본값: NOW())	-
인덱스
idx_construction_cms - cms 컬럼
idx_construction_site_name - site_name 컬럼
idx_construction_status - status 컬럼
idx_construction_department - department 컬럼
RLS (Row Level Security) 정책
SELECT: 모든 사용자 읽기 가능
INSERT: 모든 사용자 삽입 가능
DELETE: 모든 사용자 삭제 가능
데이터 통계
평균 레코드 수: 약 3,995개
업데이트 빈도: 순환 실행 시마다 (약 8분마다)
2. inpays (매출)
테이블 설명
프로젝트별 매출 거래 내역을 저장하는 테이블
컬럼 명세
컬럼명	데이터 타입	Null 허용	설명	원본 CSV 컬럼명
id	BIGSERIAL	NO	기본 키 (자동 증가)	-
construction_manager	TEXT	YES	시공 담당자	시공
sales_manager	TEXT	YES	영업 담당자	영업
department	TEXT	YES	담당 부서	부서
cms	TEXT	YES	CMS 코드	CMS
site_name	TEXT	YES	현장명	현장명
client	TEXT	YES	고객사명	고객사
item	TEXT	YES	ITEM 코드	ITEM
product_name	TEXT	YES	품명	품명
unit	TEXT	YES	단위	단위
quantity	NUMERIC	YES	수량	수량
unit_price	NUMERIC	YES	단가	단가
supply_price	INTEGER	YES	공급가액	공급가액
vat	NUMERIC	YES	부가세	부가세
total_amount	NUMERIC	YES	합계금액	합계금액
site_amount	NUMERIC	YES	현장금액	현장금액
sales_date	TEXT	YES	매출일	매출일
notes	TEXT	YES	비고	비고
creator	TEXT	YES	작성자	작성자
created_at	TEXT	YES	등록일	등록일
modifier	TEXT	YES	수정자	수정자
modified_at	TEXT	YES	수정일	수정일
synced_at	TIMESTAMPTZ	NO	동기화 시각 (기본값: NOW())	-
인덱스
idx_inpays_cms - cms 컬럼
idx_inpays_site_name - site_name 컬럼
idx_inpays_sales_date - sales_date 컬럼
idx_inpays_department - department 컬럼
RLS (Row Level Security) 정책
SELECT: 모든 사용자 읽기 가능
INSERT: 모든 사용자 삽입 가능
DELETE: 모든 사용자 삭제 가능
데이터 통계
평균 레코드 수: 약 11,148개
업데이트 빈도: 순환 실행 시마다 (약 8분마다)
3. outpays (매입)
테이블 설명
프로젝트별 매입(구매) 거래 내역을 저장하는 테이블
컬럼 명세
컬럼명	데이터 타입	Null 허용	설명	원본 CSV 컬럼명
id	BIGSERIAL	NO	기본 키 (자동 증가)	-
construction_manager	TEXT	YES	시공 담당자	시공
sales_manager	TEXT	YES	영업 담당자	영업
department	TEXT	YES	담당 부서	부서
type	TEXT	YES	매입 타입	타입
cms	TEXT	YES	CMS 코드	CMS
site_name	TEXT	YES	현장명	현장명
item	TEXT	YES	ITEM 코드	ITEM
product_name	TEXT	YES	품명	품명
unit	TEXT	YES	단위	단위
quantity	NUMERIC	YES	수량	수량
unit_price	NUMERIC	YES	단가	단가
supply_price	INTEGER	YES	공급가액	공급가액
vat	NUMERIC	YES	부가세	부가세
total_amount	NUMERIC	YES	합계금액	합계금액
purchase_date	TEXT	YES	매입일	매입일
company_name	TEXT	YES	업체명	업체명
business_number	TEXT	YES	사업자번호	사업자번호
notes	TEXT	YES	비고	비고
creator	TEXT	YES	작성자	작성자
created_at	TEXT	YES	등록일	등록일
modifier	TEXT	YES	수정자	수정자
modified_at	TEXT	YES	수정일	수정일
synced_at	TIMESTAMPTZ	NO	동기화 시각 (기본값: NOW())	-
인덱스
idx_outpays_cms - cms 컬럼
idx_outpays_site_name - site_name 컬럼
idx_outpays_purchase_date - purchase_date 컬럼
idx_outpays_department - department 컬럼
RLS (Row Level Security) 정책
SELECT: 모든 사용자 읽기 가능
INSERT: 모든 사용자 삽입 가능
DELETE: 모든 사용자 삭제 가능
데이터 통계
평균 레코드 수: 약 38,563개
업데이트 빈도: 순환 실행 시마다 (약 8분마다)
4. site_summary (현장 요약)
테이블 설명
현장별 재무 현황 요약 정보를 저장하는 테이블 (총괄 계약 현황)
컬럼 명세
컬럼명	데이터 타입	Null 허용	설명	원본 CSV 컬럼명
id	BIGSERIAL	NO	기본 키 (자동 증가)	-
department	TEXT	YES	부서명	부서
sales_manager	TEXT	YES	영업 담당자	영업
construction_manager	TEXT	YES	시공 담당자	시공
status	TEXT	YES	현장 상태	상태
cms	TEXT	YES	CMS 코드	CMS
client	TEXT	YES	건설사(고객사)	건설사
site_name	TEXT	YES	현장명	현장
contract_amount	TEXT	YES	계약금액 (쉼표 포함 문자열)	계약금액
expected_execution_amount	TEXT	YES	예상 실행금액	예상 실행금액
expected_execution_rate	DECIMAL(15,2)	YES	예상 실행률 (%)	%
expected_profit_amount	TEXT	YES	예상 손익금액	예상 손익금액
expected_profit_rate	DECIMAL(15,2)	YES	예상 손익률 (%)	%.1
construction_execution	TEXT	YES	시공실행 금액	시공실행
sales_amount	TEXT	YES	매출금액	매출금액
sales_rate	DECIMAL(15,2)	YES	매출률 (%)	%.2
purchase_amount	TEXT	YES	매입금액	매입금액
purchase_rate	DECIMAL(15,2)	YES	매입률 (%)	%.3
current_profit_status	TEXT	YES	현손익현황	현손익현황
remaining_construction	TEXT	YES	공사잔액	공사잔액
synced_at	TIMESTAMPTZ	NO	동기화 시각 (기본값: NOW())	-
인덱스
idx_site_summary_cms - cms 컬럼
idx_site_summary_site_name - site_name 컬럼
idx_site_summary_status - status 컬럼
idx_site_summary_department - department 컬럼
RLS (Row Level Security) 정책
SELECT: 모든 사용자 읽기 가능
INSERT: 모든 사용자 삽입 가능
DELETE: 모든 사용자 삭제 가능
데이터 통계
평균 레코드 수: 약 1,294개
업데이트 빈도: 순환 실행 시마다 (약 8분마다)
특이사항
금액 필드: contract_amount, expected_execution_amount 등은 쉼표가 포함된 문자열로 저장됨
비율 필드: DECIMAL(15,2)로 설정되어 큰 퍼센트 값도 저장 가능
공통 사항
데이터 동기화 방식
기존 데이터 삭제: 각 동기화 시 해당 테이블의 모든 기존 데이터 삭제
새 데이터 삽입: CSV에서 읽은 최신 데이터를 100개씩 배치로 삽입
파일 정리: 동기화 완료 후 CSV 및 JSON 파일 자동 삭제
테이블 간 관계
CMS 코드: 모든 테이블에서 공통 식별자로 사용
현장명 (site_name): construction_management, inpays, outpays, site_summary 간 조인 가능
담당자 정보: sales_manager, construction_manager, department로 교차 참조 가능
접근 방법
Supabase JavaScript/TypeScript 클라이언트
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://dmyhhbvhbpwwtrmequop.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
)

// 현장관리 조회
const { data, error } = await supabase
  .from('construction_management')
  .select('*')

// CMS로 필터링
const { data, error } = await supabase
  .from('construction_management')
  .select('*')
  .eq('cms', '2061a')

// 현장별 매출/매입 조회 (조인)
const { data, error } = await supabase
  .from('inpays')
  .select(`
    *,
    construction_management!inner(cms, site_name, status)
  `)
  .eq('cms', '2061a')
REST API
# 현장관리 전체 조회
curl 'https://dmyhhbvhbpwwtrmequop.supabase.co/rest/v1/construction_management' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"

# 특정 CMS 필터링
curl 'https://dmyhhbvhbpwwtrmequop.supabase.co/rest/v1/construction_management?cms=eq.2061a' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
데이터 freshness
모든 테이블은 약 8분마다 전체 데이터가 갱신됨
synced_at 컬럼으로 마지막 동기화 시각 확인 가능