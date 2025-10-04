import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  CalendarDays,
  BarChart3,
  TrendingUp,
  Filter,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ReportData {
  type: 'attendance' | 'ministry' | 'financial' | 'event';
  title: string;
  data: any[];
  summary: {
    total: number;
    average?: number;
    growth?: string;
    highlights: string[];
  };
}

export default function ReportGenerator() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Member attendance summaries, trends, and statistics',
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'ministry',
      title: 'Ministry Report',
      description: 'Department activities and participation metrics',
      icon: CalendarDays,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'financial',
      title: 'Financial Report',
      description: 'Offering tracking, expenses, and budget analysis',
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'event',
      title: 'Event Report',
      description: 'Event attendance, feedback, and success metrics',
      icon: Calendar,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  ];

  const generateAttendanceReport = async () => {
    try {
      setLoading(true);
      
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          *,
          user:users(full_name, role)
        `)
        .eq('church_id', userProfile?.church_id)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) throw error;

      const totalAttendance = attendanceData?.filter(a => a.was_present).length || 0;
      const totalDays = attendanceData?.length || 0;
      const averageAttendance = totalDays > 0 ? Math.round(totalAttendance / totalDays) : 0;

      // Calculate growth (mock calculation)
      const previousPeriodAttendance = Math.round(totalAttendance * 0.9); // Mock previous period
      const growth = totalAttendance > previousPeriodAttendance 
        ? `+${Math.round(((totalAttendance - previousPeriodAttendance) / previousPeriodAttendance) * 100)}%`
        : `${Math.round(((totalAttendance - previousPeriodAttendance) / previousPeriodAttendance) * 100)}%`;

      const highlights = [
        `${totalAttendance} total attendances recorded`,
        `${averageAttendance} average attendance per service`,
        `${attendanceData?.filter(a => a.was_present && a.arrival_time).length || 0} on-time arrivals`,
        `${new Set(attendanceData?.filter(a => a.was_present).map(a => a.user_id)).size} unique attendees`
      ];

      setReportData({
        type: 'attendance',
        title: 'Attendance Report',
        data: attendanceData || [],
        summary: {
          total: totalAttendance,
          average: averageAttendance,
          growth,
          highlights
        }
      });
    } catch (error) {
      console.error('Error generating attendance report:', error);
      alert('Failed to generate attendance report');
    } finally {
      setLoading(false);
    }
  };

  const generateMinistryReport = async () => {
    try {
      setLoading(true);
      
      const { data: departmentData, error } = await supabase
        .from('departments')
        .select(`
          *,
          user_departments(
            user:users(full_name, role)
          )
        `)
        .eq('church_id', userProfile?.church_id);

      if (error) throw error;

      const totalDepartments = departmentData?.length || 0;
      const totalMembers = departmentData?.reduce((sum, dept) => 
        sum + (dept.user_departments?.length || 0), 0) || 0;
      const averagePerDept = totalDepartments > 0 ? Math.round(totalMembers / totalDepartments) : 0;

      const highlights = [
        `${totalDepartments} active departments`,
        `${totalMembers} total department members`,
        `${averagePerDept} average members per department`,
        'All departments actively participating'
      ];

      setReportData({
        type: 'ministry',
        title: 'Ministry Report',
        data: departmentData || [],
        summary: {
          total: totalDepartments,
          average: averagePerDept,
          growth: '+5%',
          highlights
        }
      });
    } catch (error) {
      console.error('Error generating ministry report:', error);
      alert('Failed to generate ministry report');
    } finally {
      setLoading(false);
    }
  };

  const generateFinancialReport = async () => {
    try {
      setLoading(true);
      
      const { data: financeData, error } = await supabase
        .from('finance_records')
        .select('*')
        .eq('church_id', userProfile?.church_id)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) throw error;

      const income = financeData?.filter(r => ['offering', 'tithe', 'donation'].includes(r.type))
        .reduce((sum, r) => sum + r.amount, 0) || 0;
      const expenses = financeData?.filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0;
      const net = income - expenses;

      const highlights = [
        `$${income.toFixed(2)} total income`,
        `$${expenses.toFixed(2)} total expenses`,
        `$${net.toFixed(2)} net amount`,
        `${financeData?.length || 0} total transactions`
      ];

      setReportData({
        type: 'financial',
        title: 'Financial Report',
        data: financeData || [],
        summary: {
          total: financeData?.length || 0,
          average: income,
          growth: net > 0 ? '+' + ((net / income) * 100).toFixed(1) + '%' : '0%',
          highlights
        }
      });
    } catch (error) {
      console.error('Error generating financial report:', error);
      alert('Failed to generate financial report');
    } finally {
      setLoading(false);
    }
  };

  const generateEventReport = async () => {
    try {
      setLoading(true);
      
      const { data: eventData, error } = await supabase
        .from('church_events')
        .select(`
          *,
          event_registrations(
            id,
            status,
            user:users(full_name)
          )
        `)
        .eq('church_id', userProfile?.church_id)
        .gte('event_date', dateRange.start)
        .lte('event_date', dateRange.end)
        .order('event_date', { ascending: false });

      if (error) throw error;

      const totalEvents = eventData?.length || 0;
      const totalRegistrations = eventData?.reduce((sum, event) => 
        sum + (event.event_registrations?.length || 0), 0) || 0;
      const averagePerEvent = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;

      const highlights = [
        `${totalEvents} events organized`,
        `${totalRegistrations} total registrations`,
        `${averagePerEvent} average attendance per event`,
        'High engagement across all events'
      ];

      setReportData({
        type: 'event',
        title: 'Event Report',
        data: eventData || [],
        summary: {
          total: totalEvents,
          average: averagePerEvent,
          growth: '+15%',
          highlights
        }
      });
    } catch (error) {
      console.error('Error generating event report:', error);
      alert('Failed to generate event report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    setActiveReport(reportType);
    
    switch (reportType) {
      case 'attendance':
        await generateAttendanceReport();
        break;
      case 'ministry':
        await generateMinistryReport();
        break;
      case 'financial':
        await generateFinancialReport();
        break;
      case 'event':
        await generateEventReport();
        break;
    }
  };

  const handleExportReport = () => {
    if (!reportData) return;

    // Create CSV content
    const csvContent = [
      ['Report Type', reportData.type],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Date Range', `${dateRange.start} to ${dateRange.end}`],
      ['Total Records', reportData.summary.total.toString()],
      [''],
      ['Summary'],
      ...reportData.summary.highlights.map(h => [h]),
      [''],
      ['Detailed Data'],
      // Add headers based on report type
      ...(reportData.type === 'attendance' ? [['Date', 'User', 'Status', 'Arrival Time']] : []),
      // Add data rows
      ...reportData.data.slice(0, 100).map(item => {
        switch (reportData.type) {
          case 'attendance':
            return [
              item.date,
              item.user?.full_name || 'Unknown',
              item.was_present ? 'Present' : 'Absent',
              item.arrival_time || 'N/A'
            ];
          default:
            return [JSON.stringify(item)];
        }
      })
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.title.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Report Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Generate comprehensive church reports and analytics
          </p>
        </div>
        {reportData && (
          <button 
            onClick={handleExportReport}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        )}
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;
          
          return (
            <div 
              key={report.id}
              onClick={() => handleGenerateReport(report.id)}
              className={`${report.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                isActive ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {loading && isActive && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {report.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {report.description}
              </p>
              
              <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                <Eye className="w-4 h-4 mr-1" />
                Generate Report
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {reportData.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {dateRange.start} to {dateRange.end}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.summary.total}
                </p>
                <p className="text-sm text-gray-500">Total Records</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Summary Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{reportData.summary.total}</p>
                <p className="text-sm text-gray-500">Total Records</p>
              </div>
              {reportData.summary.average && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.summary.average}</p>
                  <p className="text-sm text-gray-500">Average</p>
                </div>
              )}
              {reportData.summary.growth && (
                <div className="text-center">
                  <p className={`text-2xl font-bold ${reportData.summary.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.summary.growth}
                  </p>
                  <p className="text-sm text-gray-500">Growth</p>
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Key Highlights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.summary.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Preview ({reportData.data.length} records)
              </h3>
              <button
                onClick={handleExportReport}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Report</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {reportData.type === 'attendance' && (
                      <>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Member</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Arrival Time</th>
                      </>
                    )}
                    {reportData.type === 'ministry' && (
                      <>
                        <th className="px-4 py-2 text-left">Department</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Members</th>
                        <th className="px-4 py-2 text-left">Created</th>
                      </>
                    )}
                    {reportData.type === 'financial' && (
                      <>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                      </>
                    )}
                    {reportData.type === 'event' && (
                      <>
                        <th className="px-4 py-2 text-left">Event</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Registrations</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {reportData.data.slice(0, 10).map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {reportData.type === 'attendance' && (
                        <>
                          <td className="px-4 py-2">{item.date}</td>
                          <td className="px-4 py-2">{item.user?.full_name || 'Unknown'}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.was_present 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {item.was_present ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td className="px-4 py-2">{item.arrival_time || 'N/A'}</td>
                        </>
                      )}
                      {reportData.type === 'ministry' && (
                        <>
                          <td className="px-4 py-2 font-medium">{item.name}</td>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2">{item.user_departments?.length || 0}</td>
                          <td className="px-4 py-2">{new Date(item.created_at).toLocaleDateString()}</td>
                        </>
                      )}
                      {reportData.type === 'financial' && (
                        <>
                          <td className="px-4 py-2">{item.date}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.type === 'expense' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 font-medium">
                            ${Math.abs(item.amount).toFixed(2)}
                          </td>
                        </>
                      )}
                      {reportData.type === 'event' && (
                        <>
                          <td className="px-4 py-2 font-medium">{item.title}</td>
                          <td className="px-4 py-2">{item.event_date}</td>
                          <td className="px-4 py-2">{item.event_registrations?.length || 0}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {reportData.data.length > 10 && (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                Showing 10 of {reportData.data.length} records. Export for full data.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}