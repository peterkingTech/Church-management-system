import React from 'react';
import { AlertCircle, Check, Clock, Zap } from 'lucide-react';
import { ImportantTodo } from '../types';
import { useTranslation } from 'react-i18next';

interface BlinkingTodoProps {
  todo: ImportantTodo;
  onComplete: (id: string) => void;
}

export default function BlinkingTodo({ todo, onComplete }: BlinkingTodoProps) {
  const { t } = useTranslation();

  if (todo.status === 'completed') return null;

  const isUrgent = todo.priority === 'urgent';
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date();

  return (
    <div className={`animate-pulse ${isUrgent ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800'} rounded-lg p-4 mb-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 ${isUrgent ? 'bg-red-500' : 'bg-yellow-500'} rounded-full animate-ping`}></div>
          {isUrgent ? (
            <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          )}
          <div className="flex-1">
            <span className={`font-medium ${isUrgent ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
              {todo.content}
            </span>
            {todo.due_date && (
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {isOverdue ? 'Overdue: ' : 'Due: '}
                  {new Date(todo.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onComplete(todo.id)}
          className={`flex items-center space-x-1 px-3 py-1 ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg text-sm transition-colors shadow-md hover:shadow-lg`}
        >
          <Check className="w-4 h-4" />
          <span>{t('completed')}</span>
        </button>
      </div>
      
      {isUrgent && (
        <div className="mt-2 text-xs text-red-700 dark:text-red-300 font-medium">
          🚨 {t('urgent')} - Immediate attention required!
        </div>
      )}
    </div>
  );
}