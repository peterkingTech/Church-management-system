import React, { useState } from 'react';
import { Download, FileText, Users, Calendar, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ExportData() {
  const { t } = useTranslation();
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState('excel');
  const [dateRange, setDateRange] = useState('last_month');

  const dataTypes = [
    { id: 'users', label: 'User Data', description: 'Member information and profiles', icon: Users },
    { id: 'attendance', label: 'Attendance Records', description: 'Service and event attendance', icon: Calendar },
    { id: 'events', label: 'Events Data', description: 'Church events and activities', icon: Calendar },
    { id: 'reports', label: 'Reports', description: 'Generated reports and analytics', icon: BarChart3 },
    { id: 'prayers', label: 'Prayer Requests', description: 'Prayer wall and requests', icon: FileText },
    { id: 'announcements', label: 'Announcements', description: 'Church announcements and notices', icon: FileText },
  ];

  const handleDataTypeToggle = (dataType: string) => {
    setSelectedData(prev => 
      prev.includes(dataType) 
        ? prev.filter(type => type !== dataType)
        : [...prev, dataType]
    );
  };

  const handleExport = () => {
    // In a real app, this would trigger the actual export
    console.log('Exporting:', { selectedData, exportFormat, dateRange });
    alert(`Exporting ${selectedData.length} data types as ${exportFormat.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('export_data')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Export church data for backup or analysis
        </p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Data to Export
            </h3>
            <div className="space-y-3">
              {dataTypes.map((dataType) => {
                const Icon = dataType.icon;
                const isSelected = selectedData.includes(dataType.id);
                return (
                  <div
                    key={dataType.id}
                    onClick={() => handleDataTypeToggle(dataType.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-100 dark:bg-blue-900/40' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isSelected 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {dataType.label}
                          </h4>
                          {isSelected && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dataType.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export Settings */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Format
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Excel (.xlsx)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Spreadsheet format</p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">CSV</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Comma-separated values</p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">PDF</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Portable document format</p>
                </div>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Date Range
            </h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="last_year">Last Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={selectedData.length === 0}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              selectedData.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Selected Data</span>
          </button>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Exports
        </h3>
        <div className="space-y-3">
          {[
            { id: '1', name: 'Monthly Attendance Report.xlsx', date: '2024-01-15', size: '2.3 MB' },
            { id: '2', name: 'Member Directory.pdf', date: '2024-01-10', size: '1.8 MB' },
            { id: '3', name: 'Event Data.csv', date: '2024-01-05', size: '856 KB' },
          ].map((export_item) => (
            <div key={export_item.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{export_item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {export_item.date} • {export_item.size}
                  </p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}