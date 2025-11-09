import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, AlertCircle } from 'lucide-react';
import type { MonthlyCollectionRow } from '../types';

interface MonthlyCollectionUploadProps {
  year: number;
  month: number;
  onDataParsed: (data: MonthlyCollectionRow[]) => void;
  onCancel: () => void;
}

export default function MonthlyCollectionUpload({
  year,
  month,
  onDataParsed,
  onCancel,
}: MonthlyCollectionUploadProps) {
  const [parsedData, setParsedData] = useState<MonthlyCollectionRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcelFile = (file: File) => {
    setError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setError('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // Skip header row and parse data
        const rows: MonthlyCollectionRow[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length >= 3 && row[0] && (row[1] !== undefined) && (row[2] !== undefined)) {
            const managerName = String(row[0]).trim();
            const collectionAmount = typeof row[1] === 'number' ? row[1] : parseFloat(String(row[1]).replace(/,/g, ''));
            const outstandingAmount = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(/,/g, ''));

            if (managerName && !isNaN(collectionAmount) && !isNaN(outstandingAmount)) {
              rows.push({
                manager_name: managerName,
                collection_amount: collectionAmount,
                outstanding_amount: outstandingAmount,
              });
            }
          }
        }

        if (rows.length === 0) {
          setError('유효한 데이터가 없습니다. 담당자, 수금 금액, 미수 금액 열을 확인해주세요.');
          return;
        }

        setParsedData(rows);
        setFileName(file.name);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError('엑셀 파일 파싱 중 오류가 발생했습니다.');
      }
    };

    reader.onerror = () => {
      setError('파일을 읽는 중 오류가 발생했습니다.');
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
        return;
      }
      parseExcelFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
        return;
      }
      parseExcelFile(file);
    }
  };

  const handleConfirm = () => {
    if (parsedData.length > 0) {
      onDataParsed(parsedData);
    }
  };

  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('ko-KR');
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          {year}년 {month}월 수금/미수금 현황 업로드
        </h3>
        <p className="text-sm text-gray-text">
          엑셀 파일을 업로드하여 월별 수금/미수금 데이터를 등록합니다.
        </p>
      </div>

      {/* File Upload Area */}
      {parsedData.length === 0 && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-border hover:border-primary/50'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-text" />
          <p className="text-white mb-2">파일을 드래그하거나 클릭하여 선택하세요</p>
          <p className="text-sm text-gray-text">Excel 파일 (.xlsx, .xls)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Parsed Data Preview */}
      {parsedData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-lighter rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white font-medium">{fileName}</p>
                <p className="text-sm text-gray-text">{parsedData.length}개 데이터</p>
              </div>
            </div>
            <button
              onClick={() => {
                setParsedData([]);
                setFileName('');
                setError('');
              }}
              className="text-gray-text hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">번호</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">담당자</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">수금 금액 (원)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">미수 금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-border hover:bg-bg-lighter transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-white">{row.manager_name}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-white">
                      {formatAmount(row.collection_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-white">
                      {formatAmount(row.outstanding_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-bg-lighter border-t-2 border-primary">
                  <td colSpan={2} className="px-4 py-4 text-sm text-white font-bold">합계</td>
                  <td className="px-4 py-4 text-sm text-right font-mono font-bold text-white">
                    {formatAmount(parsedData.reduce((sum, row) => sum + row.collection_amount, 0))}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono font-bold text-white">
                    {formatAmount(parsedData.reduce((sum, row) => sum + row.outstanding_amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onCancel} className="btn-secondary">
          취소
        </button>
        <button
          onClick={handleConfirm}
          disabled={parsedData.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          확인
        </button>
      </div>
    </div>
  );
}
