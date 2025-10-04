import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Wifi, Database, Key } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function LoadingDiagnostics() {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([
    { name: 'Environment Variables', status: 'checking', message: 'Checking configuration...' },
    { name: 'Network Connection', status: 'checking', message: 'Testing connectivity...' },
    { name: 'Supabase Connection', status: 'checking', message: 'Connecting to database...' },
    { name: 'Authentication Service', status: 'checking', message: 'Verifying auth service...' },
    { name: 'Database Tables', status: 'checking', message: 'Checking database schema...' }
  ]);

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    // Check 1: Environment Variables
    setTimeout(() => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      updateCheck('Environment Variables', 
        supabaseUrl && supabaseKey ? 'success' : 'error',
        supabaseUrl && supabaseKey ? 'Configuration found' : 'Missing Supabase credentials',
        `URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}, Key: ${supabaseKey ? '✓ Set' : '✗ Missing'}`
      );
    }, 500);

    // Check 2: Network Connection
    setTimeout(async () => {
      try {
        const response = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        updateCheck('Network Connection', 
          response.ok ? 'success' : 'error',
          response.ok ? 'Internet connection active' : 'Network issues detected'
        );
      } catch (error) {
        updateCheck('Network Connection', 'error', 'No internet connection', error.message);
      }
    }, 1000);

    // Check 3: Supabase Connection
    setTimeout(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          updateCheck('Supabase Connection', 'error', 'Supabase URL not configured');
          return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          },
          signal: AbortSignal.timeout(5000)
        });

        updateCheck('Supabase Connection', 
          response.ok ? 'success' : 'error',
          response.ok ? 'Supabase API accessible' : `API error: ${response.status}`,
          `Response: ${response.status} ${response.statusText}`
        );
      } catch (error) {
        updateCheck('Supabase Connection', 'error', 'Cannot reach Supabase', error.message);
      }
    }, 1500);

    // Check 4: Authentication Service
    setTimeout(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          updateCheck('Authentication Service', 'error', 'Cannot test - no Supabase URL');
          return;
        }

        const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          },
          signal: AbortSignal.timeout(5000)
        });

        updateCheck('Authentication Service', 
          response.ok ? 'success' : 'warning',
          response.ok ? 'Auth service available' : 'Auth service issues detected'
        );
      } catch (error) {
        updateCheck('Authentication Service', 'warning', 'Auth check failed', error.message);
      }
    }, 2000);

    // Check 5: Database Tables
    setTimeout(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          updateCheck('Database Tables', 'error', 'Cannot test - missing credentials');
          return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'count=exact'
          },
          signal: AbortSignal.timeout(5000)
        });

        updateCheck('Database Tables', 
          response.ok ? 'success' : 'error',
          response.ok ? 'Database tables accessible' : 'Database schema issues',
          response.ok ? 'Users table found' : `Error: ${response.status}`
        );
      } catch (error) {
        updateCheck('Database Tables', 'error', 'Database check failed', error.message);
      }
    }, 2500);
  };

  const updateCheck = (name: string, status: DiagnosticCheck['status'], message: string, details?: string) => {
    setChecks(prev => prev.map(check => 
      check.name === name ? { ...check, status, message, details } : check
    ));
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'checking': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'checking': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
    }
  };

  const hasErrors = checks.some(check => check.status === 'error');
  const allComplete = checks.every(check => check.status !== 'checking');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            System Diagnostics
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Checking system components...
          </p>
        </div>

        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{check.name}</p>
                  <p className={`text-sm ${getStatusColor(check.status)}`}>{check.message}</p>
                  {check.details && showDetails && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{check.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col space-y-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {allComplete && (
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
              {hasErrors && (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Continue Anyway
                </button>
              )}
            </div>
          )}
        </div>

        {hasErrors && allComplete && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Issues Detected</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {checks.filter(c => c.status === 'error').map((check, i) => (
                <li key={i}>• {check.name}: {check.message}</li>
              ))}
            </ul>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Contact your system administrator if these issues persist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}