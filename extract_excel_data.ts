import * as XLSX from 'xlsx';
import * as fs from 'fs';

// constructions.xlsx 읽기
const constructionsWorkbook = XLSX.readFile('constructions.xlsx');
const constructionsSheet = constructionsWorkbook.Sheets[constructionsWorkbook.SheetNames[0]];
const constructionsData = XLSX.utils.sheet_to_json(constructionsSheet);

const constructionNames = [...new Set(constructionsData.map((row: any) => row['업체명']))];

console.log(`총 건설사 수: ${constructionNames.length}`);
console.log('\n건설사 목록:');
constructionNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
});

// items.xlsx 읽기
const itemsWorkbook = XLSX.readFile('items.xlsx');
const itemsSheet = itemsWorkbook.Sheets[itemsWorkbook.SheetNames[0]];
const itemsData = XLSX.utils.sheet_to_json(itemsSheet);

console.log(`\n총 품목 수: ${itemsData.length}`);
console.log('\n품목 목록:');
itemsData.forEach((item: any) => {
  console.log(`- ${item.item_id}: ${item.item_name}`);
});

// SQL INSERT 문 생성
console.log('\n\n=== SQL INSERT 문 ===\n');

// constructions 테이블 INSERT
console.log('-- constructions 테이블 데이터 삽입');
console.log('INSERT INTO constructions (company_name) VALUES');
const constructionValues = constructionNames.map(name => {
  const escaped = name.replace(/'/g, "''");
  return `('${escaped}')`;
});
console.log(constructionValues.join(',\n'));
console.log('ON CONFLICT (company_name) DO NOTHING;');

// items 테이블 INSERT
console.log('\n-- items 테이블 데이터 삽입');
console.log('INSERT INTO items (item_id, item_name) VALUES');
const itemValues = itemsData.map((item: any) => {
  const escapedId = item.item_id.replace(/'/g, "''");
  const escapedName = item.item_name.replace(/'/g, "''");
  return `('${escapedId}', '${escapedName}')`;
});
console.log(itemValues.join(',\n'));
console.log('ON CONFLICT (item_id) DO NOTHING;');

// JSON 형식으로도 저장
const data = {
  constructions: constructionNames,
  items: itemsData
};

fs.writeFileSync('excel_data.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('\n\nJSON 파일로도 저장되었습니다: excel_data.json');

// SQL 파일로도 저장
const sqlContent = `-- constructions 테이블 데이터 삽입
INSERT INTO constructions (company_name) VALUES
${constructionValues.join(',\n')}
ON CONFLICT (company_name) DO NOTHING;

-- items 테이블 데이터 삽입
INSERT INTO items (item_id, item_name) VALUES
${itemValues.join(',\n')}
ON CONFLICT (item_id) DO NOTHING;`;

fs.writeFileSync('initial_data.sql', sqlContent, 'utf-8');
console.log('SQL 파일로도 저장되었습니다: initial_data.sql');