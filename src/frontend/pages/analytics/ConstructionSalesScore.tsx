import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import type { User, ConstructionScoreStats, ConstructionItemScore } from '../../types';

interface ConstructionSalesScoreProps {
  user: User;
}

export default function ConstructionSalesScore({ user }: ConstructionSalesScoreProps) {
  const [scores, setScores] = useState<ConstructionScoreStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedQuoteRows, setExpandedQuoteRows] = useState<Set<string>>(new Set());
  const [expandedMeetingRows, setExpandedMeetingRows] = useState<Set<string>>(new Set());

  // 필터 상태
  const [selectedUser, setSelectedUser] = useState<string>(user.id);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<'all' | '본점' | '인천'>('all');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // 요약 정보
  const [summary, setSummary] = useState({
    total_constructions: 0,
    total_activities: 0
  });

  // Check if current user is multi-branch
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';

  // 관리자인 경우 사용자 목록
  const [users, setUsers] = useState<any[]>([]);

  // 사용자 목록 로드 (관리자만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  // 점수 데이터 로드
  useEffect(() => {
    fetchScores();
  }, [selectedUser, selectedCreatedBy, selectedBranch, year, month, viewMode]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        if (user.role === 'admin' && !selectedUser && !selectedCreatedBy && data.data.length > 0) {
          const firstUser = data.data[0];
          setSelectedUser(firstUser.id);
          if (firstUser.created_by) {
            setSelectedCreatedBy(firstUser.created_by);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchScores = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams();

      // 사용자 필터링
      if (user.role === 'admin') {
        if (selectedCreatedBy) {
          params.append('created_by', selectedCreatedBy);
        } else if (selectedUser) {
          params.append('user_id', selectedUser);
        }
      } else if (isMultiBranchUser && selectedBranch !== 'all') {
        const createdByValue = selectedBranch === '인천' ? `${user.name}(In)` : user.name;
        params.append('created_by', createdByValue);
      } else {
        params.append('user_id', user.id);
      }

      // 기간 설정
      if (viewMode === 'month') {
        params.append('year', year.toString());
        params.append('month', month.toString());
      } else {
        params.append('year', year.toString());
      }

      const endpoint = viewMode === 'month'
        ? '/api/construction-score-stats/month'
        : '/api/construction-score-stats/year';

      const response = await fetch(`${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.data) {
        setScores(data.data.scores || []);
        setSummary(data.data.summary || { total_constructions: 0, total_activities: 0 });
      } else {
        setError(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const toggleQuoteRowExpansion = (constructionId: number, itemId: number) => {
    const key = `${constructionId}_${itemId}`;
    const newExpandedRows = new Set(expandedQuoteRows);
    if (newExpandedRows.has(key)) {
      newExpandedRows.delete(key);
    } else {
      newExpandedRows.add(key);
    }
    setExpandedQuoteRows(newExpandedRows);
  };

  const toggleMeetingRowExpansion = (constructionId: number, itemId: number) => {
    const key = `${constructionId}_${itemId}`;
    const newExpandedRows = new Set(expandedMeetingRows);
    if (newExpandedRows.has(key)) {
      newExpandedRows.delete(key);
    } else {
      newExpandedRows.add(key);
    }
    setExpandedMeetingRows(newExpandedRows);
  };

  const isQuoteRowExpanded = (constructionId: number, itemId: number) => {
    const key = `${constructionId}_${itemId}`;
    return expandedQuoteRows.has(key);
  };

  const isMeetingRowExpanded = (constructionId: number, itemId: number) => {
    const key = `${constructionId}_${itemId}`;
    return expandedMeetingRows.has(key);
  };

  // 활동 히스토리를 점수 증감과 함께 계산
  const calculateActivityHistory = (activities: string[]) => {
    return activities.map((date, index) => ({
      date,
      increment: index === 0 ? 1.0 : 0.1,
      cumulativeScore: index === 0 ? 1.0 : 1.0 + index * 0.1
    }));
  };

  // 년도 옵션 (현재 년도부터 5년 전까지)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title mb-2">건설사 영업 스코어</h1>
          <p className="page-description">
            건설사별 영업 활동을 아이템 단위로 분석합니다.
          </p>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* 관리자만: 사용자 선택 */}
          {user.role === 'admin' && users.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">사용자</label>
              <select
                value={selectedCreatedBy || selectedUser}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  const selectedUserData = users.find(u =>
                    u.created_by ? u.created_by === selectedValue : u.id === selectedValue
                  );

                  if (selectedUserData) {
                    setSelectedUser(selectedUserData.id);
                    setSelectedCreatedBy(selectedUserData.created_by || '');
                  }
                }}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                {users.map((u, index) => (
                  <option key={`${u.id}-${index}`} value={u.created_by || u.id} className="bg-bg-darker text-white">
                    {u.display_name || `${u.name} (${u.department})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 다중 지점 사용자: 지점 선택 */}
          {user.role !== 'admin' && isMultiBranchUser && (
            <div className="w-40">
              <label className="block text-sm font-medium text-white mb-2">지점</label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value as 'all' | '본점' | '인천');
                }}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="all" className="bg-bg-darker text-white">전체</option>
                <option value="본점" className="bg-bg-darker text-white">본점</option>
                <option value="인천" className="bg-bg-darker text-white">인천</option>
              </select>
            </div>
          )}

          {/* 조회 모드 */}
          <div className="w-32">
            <label className="block text-sm font-medium text-white mb-2">조회 기간</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'month' | 'year')}
              className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="month" className="bg-bg-darker text-white">월별</option>
              <option value="year" className="bg-bg-darker text-white">연도별</option>
            </select>
          </div>

          {/* 년도 선택 */}
          <div className="w-40">
            <label className="block text-sm font-medium text-white mb-2">년도</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y} className="bg-bg-darker text-white">
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {/* 월 선택 (월별 모드일 때만) */}
          {viewMode === 'month' && (
            <div className="w-32">
              <label className="block text-sm font-medium text-white mb-2">월</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-bg-darker text-white">
                    {m}월
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 새로고침 버튼 */}
          <div>
            <button
              onClick={fetchScores}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 h-[42px]"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-text mb-1">총 건설사 수</p>
              <p className="text-2xl font-bold text-text-primary">{summary.total_constructions}개</p>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Building2 size={20} className="text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-text mb-1">총 활동 횟수</p>
              <p className="text-2xl font-bold text-text-primary">{summary.total_activities}회</p>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp size={20} className="text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* 테이블 */}
      {loading ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-20 text-gray-text">
            <RefreshCw size={48} className="animate-spin mb-4 opacity-50" />
            <p className="text-lg">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : scores.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-20 text-gray-text">
            <Building2 size={48} className="mb-4 opacity-50" />
            <p className="text-lg">활동 데이터가 없습니다.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 견적 테이블 */}
          <div className="card overflow-hidden">
            <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3">
              <h2 className="text-lg font-semibold text-blue-400">견적 제출</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-border">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-text">순위</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-text">건설사</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-text">품목</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-text">횟수</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-text">점수</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-text">최근 활동</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.flatMap((score, constructionIndex) =>
                    score.item_scores
                      .filter(item => item.quote_count > 0)
                      .map((item, itemIndex) => {
                        const isExpanded = isQuoteRowExpanded(score.construction_id, item.item_id);
                        const history = calculateActivityHistory(item.quote_activities);

                        return (
                          <React.Fragment key={`quote-${score.construction_id}-${item.item_id}`}>
                            <tr
                              onClick={() => toggleQuoteRowExpansion(score.construction_id, item.item_id)}
                              className="border-b border-gray-border hover:bg-bg-darker/50 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="text-gray-text text-sm mr-2">{constructionIndex + 1}</span>
                                  {isExpanded ? (
                                    <ChevronUp size={16} className="text-blue-400" />
                                  ) : (
                                    <ChevronDown size={16} className="text-gray-text" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-text-primary font-medium text-sm">{score.construction_name}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-text-primary text-sm">{item.item_name}</p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-blue-400 font-semibold">{item.quote_count}회</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-blue-300 font-bold">{item.quote_score.toFixed(1)}점</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.recent_activity_date ? (
                                  <div>
                                    <p className="text-text-primary text-xs">
                                      {formatDate(item.recent_activity_date)}
                                    </p>
                                    <p className="text-gray-text text-xs">
                                      {item.days_since_last_activity}일 전
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-text">-</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-blue-500/5">
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="text-sm">
                                    <p className="text-blue-400 font-semibold mb-3">활동 히스토리</p>
                                    <div className="space-y-2">
                                      {history.map((entry, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-1 px-2 bg-bg-darker rounded">
                                          <span className="text-gray-text">{entry.date}</span>
                                          <div className="flex items-center space-x-4">
                                            <span className="text-blue-300">+{entry.increment.toFixed(1)}점</span>
                                            <span className="text-blue-400 font-semibold min-w-[60px] text-right">
                                              누적: {entry.cumulativeScore.toFixed(1)}점
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 미팅 테이블 */}
          <div className="card overflow-hidden">
            <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-3">
              <h2 className="text-lg font-semibold text-green-400">미팅 진행</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-border">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-text">순위</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-text">건설사</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-text">품목</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-text">횟수</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-text">점수</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-text">최근 활동</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.flatMap((score, constructionIndex) =>
                    score.item_scores
                      .filter(item => item.meeting_count > 0)
                      .map((item, itemIndex) => {
                        const isExpanded = isMeetingRowExpanded(score.construction_id, item.item_id);
                        const history = calculateActivityHistory(item.meeting_activities);

                        return (
                          <React.Fragment key={`meeting-${score.construction_id}-${item.item_id}`}>
                            <tr
                              onClick={() => toggleMeetingRowExpansion(score.construction_id, item.item_id)}
                              className="border-b border-gray-border hover:bg-bg-darker/50 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="text-gray-text text-sm mr-2">{constructionIndex + 1}</span>
                                  {isExpanded ? (
                                    <ChevronUp size={16} className="text-green-400" />
                                  ) : (
                                    <ChevronDown size={16} className="text-gray-text" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-text-primary font-medium text-sm">{score.construction_name}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-text-primary text-sm">{item.item_name}</p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-green-400 font-semibold">{item.meeting_count}회</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-green-300 font-bold">{item.meeting_score.toFixed(1)}점</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.recent_activity_date ? (
                                  <div>
                                    <p className="text-text-primary text-xs">
                                      {formatDate(item.recent_activity_date)}
                                    </p>
                                    <p className="text-gray-text text-xs">
                                      {item.days_since_last_activity}일 전
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-text">-</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-green-500/5">
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="text-sm">
                                    <p className="text-green-400 font-semibold mb-3">활동 히스토리</p>
                                    <div className="space-y-2">
                                      {history.map((entry, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-1 px-2 bg-bg-darker rounded">
                                          <span className="text-gray-text">{entry.date}</span>
                                          <div className="flex items-center space-x-4">
                                            <span className="text-green-300">+{entry.increment.toFixed(1)}점</span>
                                            <span className="text-green-400 font-semibold min-w-[60px] text-right">
                                              누적: {entry.cumulativeScore.toFixed(1)}점
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
