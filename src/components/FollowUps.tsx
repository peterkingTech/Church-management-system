import React, { useState, useEffect } from 'react';
import { Target, Plus, User, Phone, Mail, Calendar, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FollowUp {
  id: string;
  newcomer_id: string;
  assigned_worker_id: string;
  status: 'pending' | 'contacted' | 'in_progress' | 'completed';
  last_contacted: string | null;
  next_contact_date: string | null;
  notes: string;
  newcomer: {
    full_name: string;
    email: string;
    phone: string;
    church_joined_at: string;
  };
  assigned_worker: {
    full_name: string;
  };
  created_at: string;
}

export default function FollowUps() {
  const { userProfile } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [newcomers, setNewcomers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedNewcomer, setSelectedNewcomer] = useState<string>('');
  const [selectedWorker, setSelectedWorker] = useState<string>('');

  useEffect(() => {
    if (userProfile?.role === 'pastor' || userProfile?.role === 'admin' || userProfile?.role === 'worker') {
      loadFollowUps();
      loadNewcomers();
      loadWorkers();
    }
  }, [userProfile]);

  const loadFollowUps = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('follow_ups')
        .select(`
          *,
          newcomer:users!follow_ups_newcomer_id_fkey(full_name, email, phone, church_joined_at),
          assigned_worker:users!follow_ups_assigned_worker_id_fkey(full_name)
        `)
        .eq('church_id', userProfile.church_id);

      // Workers can only see their own follow-ups
      if (userProfile.role === 'worker') {
        query = query.eq('assigned_worker_id', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNewcomers = async () => {
    if (!userProfile?.church_id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, church_joined_at')
        .eq('church_id', userProfile.church_id)
        .eq('role', 'newcomer')
        .is('assigned_worker_id', null)
        .order('church_joined_at', { ascending: false });

      if (error) throw error;
      setNewcomers(data || []);
    } catch (error) {
      console.error('Error loading newcomers:', error);
    }
  };

  const loadWorkers = async () => {
    if (!userProfile?.church_id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('church_id', userProfile.church_id)
        .eq('role', 'worker')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  };

  const assignWorkerToNewcomer = async () => {
    if (!selectedNewcomer || !selectedWorker) {
      alert('Please select both a newcomer and a worker');
      return;
    }

    try {
      // Update newcomer with assigned worker
      const { error: updateError } = await supabase
        .from('users')
        .update({ assigned_worker_id: selectedWorker })
        .eq('id', selectedNewcomer);

      if (updateError) throw updateError;

      // Create follow-up record
      const { error: followUpError } = await supabase
        .from('follow_ups')
        .insert({
          church_id: userProfile?.church_id,
          newcomer_id: selectedNewcomer,
          assigned_worker_id: selectedWorker,
          status: 'pending',
          notes: 'Initial assignment for newcomer follow-up'
        });

      if (followUpError) throw followUpError;

      // Create notification for worker
      await supabase
        .from('notifications')
        .insert({
          church_id: userProfile?.church_id,
          user_id: selectedWorker,
          title: 'New Newcomer Assigned',
          message: 'You have been assigned a new newcomer for follow-up',
          notification_type: 'task',
          priority: 'high'
        });

      alert('Worker assigned successfully!');
      setShowAssignForm(false);
      setSelectedNewcomer('');
      setSelectedWorker('');
      await loadFollowUps();
      await loadNewcomers();
    } catch (error) {
      console.error('Error assigning worker:', error);
      alert('Failed to assign worker');
    }
  };

  const updateFollowUpStatus = async (followUpId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .update({
          status,
          last_contacted: new Date().toISOString().split('T')[0],
          notes: notes || `Status updated to ${status}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', followUpId);

      if (error) throw error;
      
      await loadFollowUps();
      alert('Follow-up status updated successfully!');
    } catch (error) {
      console.error('Error updating follow-up:', error);
      alert('Failed to update follow-up status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pending': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'contacted': return <MessageSquare className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <Target className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (userProfile?.role !== 'pastor' && userProfile?.role !== 'admin' && userProfile?.role !== 'worker') {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Access denied. Only pastors, admins, and workers can manage follow-ups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Newcomer Follow-ups
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track and manage newcomer integration and discipleship
          </p>
        </div>
        {(userProfile?.role === 'pastor' || userProfile?.role === 'admin') && (
          <button 
            onClick={() => setShowAssignForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Worker</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{followUps.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {followUps.filter(f => f.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {followUps.filter(f => f.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {followUps.filter(f => f.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unassigned Newcomers */}
      {newcomers.length > 0 && (userProfile?.role === 'pastor' || userProfile?.role === 'admin') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
              Unassigned Newcomers ({newcomers.length})
            </h3>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            These newcomers need to be assigned to workers for follow-up.
          </p>
        </div>
      )}

      {/* Follow-ups List */}
      <div className="space-y-4">
        {followUps.map((followUp) => (
          <div key={followUp.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {followUp.newcomer.full_name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(followUp.status)}`}>
                      {getStatusIcon(followUp.status)}
                      <span className="ml-1 capitalize">{followUp.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{followUp.newcomer.email}</span>
                    </div>
                    {followUp.newcomer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{followUp.newcomer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {new Date(followUp.newcomer.church_joined_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {followUp.assigned_worker.full_name}</span>
                    </div>
                  </div>

                  {followUp.notes && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {followUp.notes}
                      </p>
                    </div>
                  )}

                  {followUp.last_contacted && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Last contacted: {new Date(followUp.last_contacted).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {followUp.status !== 'completed' && (
                  <>
                    <button
                      onClick={() => updateFollowUpStatus(followUp.id, 'contacted')}
                      className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                    >
                      Mark Contacted
                    </button>
                    <button
                      onClick={() => updateFollowUpStatus(followUp.id, 'in_progress')}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateFollowUpStatus(followUp.id, 'completed')}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                    >
                      Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {followUps.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No follow-ups assigned yet. Assign workers to newcomers to start tracking.
          </p>
        </div>
      )}

      {/* Assign Worker Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assign Worker to Newcomer
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Newcomer
                </label>
                <select
                  value={selectedNewcomer}
                  onChange={(e) => setSelectedNewcomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose newcomer...</option>
                  {newcomers.map((newcomer) => (
                    <option key={newcomer.id} value={newcomer.id}>
                      {newcomer.full_name} - {newcomer.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign Worker
                </label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose worker...</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignWorkerToNewcomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}