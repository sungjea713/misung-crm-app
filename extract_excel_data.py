#!/usr/bin/env python3
import pandas as pd
import json

# constructions.xlsx 읽기
constructions_df = pd.read_excel('constructions.xlsx')
constructions = constructions_df['업체명'].unique().tolist()

print(f"총 건설사 수: {len(constructions)}")
print("\n건설사 목록:")
for i, company in enumerate(constructions, 1):
    print(f"{i}. {company}")

# items.xlsx 읽기
items_df = pd.read_excel('items.xlsx')
items = []
for _, row in items_df.iterrows():
    items.append({
        'item_id': row['item_id'],
        'item_name': row['item_name']
    })

print(f"\n\n총 품목 수: {len(items)}")
print("\n품목 목록:")
for item in items:
    print(f"- {item['item_id']}: {item['item_name']}")

# SQL INSERT 문 생성
print("\n\n=== SQL INSERT 문 ===\n")

# constructions 테이블 INSERT
print("-- constructions 테이블 데이터 삽입")
print("INSERT INTO constructions (company_name) VALUES")
construction_values = []
for company in constructions:
    # SQL 이스케이프 처리
    escaped_company = company.replace("'", "''")
    construction_values.append(f"('{escaped_company}')")

print(",\n".join(construction_values))
print("ON CONFLICT (company_name) DO NOTHING;")

print("\n-- items 테이블 데이터 삽입")
print("INSERT INTO items (item_id, item_name) VALUES")
item_values = []
for item in items:
    item_id = item['item_id'].replace("'", "''")
    item_name = item['item_name'].replace("'", "''")
    item_values.append(f"('{item_id}', '{item_name}')")

print(",\n".join(item_values))
print("ON CONFLICT (item_id) DO NOTHING;")

# JSON 형식으로도 저장
data = {
    'constructions': constructions,
    'items': items
}

with open('excel_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n\nJSON 파일로도 저장되었습니다: excel_data.json")