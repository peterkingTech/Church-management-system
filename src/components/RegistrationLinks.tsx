import React, { useState, useEffect } from 'react';
import { Link, Plus, Copy, Users, Calendar, Check, X, QrCode, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface InviteLink {
  id: string;
  code: string;
  role: 'worker' | 'member' | 'newcomer';
  department_id?: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  created_by: string;
  is_active: boolean;
  qr_code_url?: string;
  created_at: string;
}

export default function InviteUsers() {
  const { userProfile } = useAuth();
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    role: 'newcomer' as const,
    department_id: '',
    expires_in_days: '30',
    max_uses: '10'
  });

  useEffect(() => {
    if (userProfile?.role === 'pastor' || userProfile?.role === 'admin') {
      loadInviteData();
    }
  }, [userProfile]);

  const loadInviteData = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);

      // Load existing invite links
      const { data: links } = await supabase
        .from('invite_links')
        .select(`
          *,
          department:departments(name),
          creator:users!invite_links_created_by_fkey(full_name)
        `)
        .eq('church_id', userProfile.church_id)
        .order('created_at', { ascending: false });

      setInviteLinks(links || []);

      // Load departments for selection
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, type')
        .eq('church_id', userProfile.church_id)
        .eq('is_active', true)
        .order('name');

      setDepartments(depts || []);

    } catch (error) {
      console.error('Error loading invite data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = async () => {
    if (!userProfile?.church_id) return;

    try {
      const code = `${formData.role.toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expires_in_days));

      // Generate QR code URL (in production, you'd use a QR code service)
      const qrCodeUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#7C3AED"/>
          <rect x="20" y="20" width="160" height="160" fill="#fff"/>
          <text x="100" y="110" text-anchor="middle" fill="#7C3AED" font-size="12">${code}</text>
        </svg>
      `)}`;

      const { error } = await supabase
        .from('invite_links')
        .insert({
          church_id: userProfile.church_id,
          code,
          role: formData.role,
          department_id: formData.department_id || null,
          expires_at: expiresAt.toISOString(),
          max_uses: parseInt(formData.max_uses),
          created_by: userProfile.id,
          qr_code_url: qrCodeUrl
        });

      if (error) throw error;

      await loadInviteData();
      setShowCreateForm(false);
      setFormData({
        role: 'newcomer',
        department_id: '',
        expires_in_days: '30',
        max_uses: '10'
      });

      alert('Invite link created successfully!');
    } catch (error) {
      console.error('Error creating invite link:', error);
      alert('Failed to create invite link');
    }
  };

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/register?invite=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };

  const deactivateLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('invite_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;
      
      await loadInviteData();
      alert('Invite link deactivated successfully!');
    } catch (error) {
      console.error('Error deactivating link:', error);
      alert('Failed to deactivate link');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'worker': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'newcomer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (userProfile?.role !== 'pastor' && userProfile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Only pastors and admins can create invite links.
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
            Invite Users
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create invitation links for new church members
          </p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-yellow-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invite</span>
        </button>
      </div>

      {/* Quick Invite Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['newcomer', 'member', 'worker'].map((role) => (
          <div key={role} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                role === 'worker' ? 'bg-blue-100 dark:bg-blue-900/20' :
                role === 'member' ? 'bg-green-100 dark:bg-green-900/20' :
                'bg-yellow-100 dark:bg-yellow-900/20'
              }`}>
                <Users className={`w-8 h-8 ${
                  role === 'worker' ? 'text-blue-600' :
                  role === 'member' ? 'text-green-600' :
                  'text-yellow-600'
                }`} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                {role} Invitation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {role === 'worker' ? 'Department leaders and ministry staff' :
                 role === 'member' ? 'Regular church members' :
                 'New visitors and first-time attendees'}
              </p>
              <button
                onClick={() => {
                  setFormData({ ...formData, role: role as any });
                  generateInviteLink();
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  role === 'worker' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  role === 'member' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                Quick Generate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Invite Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Invitation Links
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invite Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {inviteLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {link.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(link.role)}`}>
                      {link.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {link.department?.name || 'Any Department'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {link.current_uses}/{link.max_uses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(link.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => copyInviteLink(link.code)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Copy invite link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        title="View QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      {link.is_active && (
                        <button 
                          onClick={() => deactivateLink(link.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Deactivate invite"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invite Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Invitation Link
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="newcomer">Newcomer</option>
                  <option value="member">Member</option>
                  <option value="worker">Worker/Leader</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'newcomer' ? 'New visitors with limited access' :
                   formData.role === 'member' ? 'Church members with full participation' :
                   'Department leaders and ministry staff'}
                </p>
              </div>

              {formData.role === 'worker' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department (Optional)
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expires In
                  </label>
                  <select
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_in_days: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Uses
                  </label>
                  <select
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="1">1 Use</option>
                    <option value="5">5 Uses</option>
                    <option value="10">10 Uses</option>
                    <option value="25">25 Uses</option>
                    <option value="50">50 Uses</option>
                    <option value="100">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateInviteLink}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-yellow-500 text-white rounded-lg hover:from-purple-700 hover:to-yellow-600 transition-colors"
              >
                Create Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Link className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inviteLinks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inviteLinks.reduce((sum, link) => sum + link.current_uses, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inviteLinks.filter(link => link.is_active && new Date(link.expires_at) > new Date()).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <X className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inviteLinks.filter(link => new Date(link.expires_at) <= new Date()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchical Access Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start space-x-3">
          <Crown className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-400 mb-2">
              Hierarchical Access Control
            </h3>
            <div className="text-sm text-purple-700 dark:text-purple-200 space-y-1">
              <p>• <strong>Only Pastor/Admin</strong> can create new accounts via invite links</p>
              <p>• <strong>Workers</strong> manage departments but cannot create accounts</p>
              <p>• <strong>Members</strong> participate fully but cannot add new users</p>
              <p>• <strong>Newcomers</strong> have limited access until promoted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}