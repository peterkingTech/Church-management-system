import React, { useState, useEffect } from 'react';
import { Crown, Users, ArrowUp, CheckCircle, Clock, User, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PromotionCandidate {
  id: string;
  full_name: string;
  email: string;
  current_role: string;
  church_joined_at: string;
  discipleship_level?: string;
  attendance_rate: number;
  soul_winning_count: number;
  recommended_role: string;
  reason: string;
}

export default function UserPromotions() {
  const { userProfile, promoteUser } = useAuth();
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [promotionHistory, setPromotionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.role === 'pastor') {
      loadPromotionData();
    }
  }, [userProfile]);

  const loadPromotionData = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);

      // Load users eligible for promotion
      const { data: users } = await supabase
        .from('users')
        .select(`
          *,
          soul_winning_records(count),
          attendance_records:attendance(count)
        `)
        .eq('church_id', userProfile.church_id)
        .neq('id', userProfile.id)
        .order('church_joined_at', { ascending: true });

      // Analyze promotion candidates
      const candidates: PromotionCandidate[] = (users || []).map(user => {
        const daysSinceJoined = Math.floor(
          (new Date().getTime() - new Date(user.church_joined_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const soulWinningCount = user.soul_winning_records?.[0]?.count || 0;
        const attendanceCount = user.attendance_records?.[0]?.count || 0;
        const attendanceRate = Math.min(100, (attendanceCount / Math.max(1, daysSinceJoined / 7)) * 100);

        let recommendedRole = user.role;
        let reason = '';

        // Promotion logic
        if (user.role === 'newcomer' && daysSinceJoined >= 30 && attendanceRate >= 75) {
          recommendedRole = 'member';
          reason = 'Consistent attendance for 30+ days';
        } else if (user.role === 'member' && daysSinceJoined >= 90 && soulWinningCount >= 2 && attendanceRate >= 85) {
          recommendedRole = 'worker';
          reason = 'Demonstrated leadership and evangelism';
        } else if (user.role === 'worker' && daysSinceJoined >= 365 && soulWinningCount >= 10) {
          recommendedRole = 'admin';
          reason = 'Proven leadership and ministry impact';
        }

        return {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          current_role: user.role,
          church_joined_at: user.church_joined_at,
          discipleship_level: user.discipleship_level,
          attendance_rate: Math.round(attendanceRate),
          soul_winning_count: soulWinningCount,
          recommended_role,
          reason
        };
      }).filter(candidate => candidate.recommended_role !== candidate.current_role);

      setCandidates(candidates);

      // Load promotion history
      const { data: history } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(full_name)
        `)
        .eq('church_id', userProfile.church_id)
        .eq('action', 'UPDATE')
        .eq('table_name', 'users')
        .contains('new_values', { role: true })
        .order('created_at', { ascending: false })
        .limit(10);

      setPromotionHistory(history || []);

    } catch (error) {
      console.error('Error loading promotion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotion = async (userId: string, newRole: string) => {
    if (!userProfile || userProfile.role !== 'pastor') {
      alert('Only pastors can promote users');
      return;
    }

    try {
      setPromoting(userId);
      
      const { error } = await promoteUser(userId, newRole as any);
      
      if (error) {
        alert('Failed to promote user: ' + error.message);
      } else {
        alert('User promoted successfully!');
        await loadPromotionData(); // Reload data
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user');
    } finally {
      setPromoting(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'pastor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'worker': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'newcomer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'pastor': return <Crown className="w-4 h-4" />;
      case 'admin': return <Award className="w-4 h-4" />;
      case 'worker': return <Users className="w-4 h-4" />;
      case 'member': return <User className="w-4 h-4" />;
      case 'newcomer': return <Sparkles className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  if (userProfile?.role !== 'pastor') {
    return (
      <div className="text-center py-12">
        <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Only pastors can manage user promotions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Promotions
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Promote users based on their spiritual growth and ministry involvement
        </p>
      </div>

      {/* Promotion Candidates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Promotion Candidates ({candidates.length})
          </h3>
        </div>
        
        {candidates.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Promotions Needed
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              All users are appropriately positioned for their current growth level.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {candidate.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {candidate.full_name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {candidate.email}
                      </p>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(candidate.current_role)}`}>
                            {getRoleIcon(candidate.current_role)}
                            <span className="ml-1">{candidate.current_role}</span>
                          </span>
                          <ArrowUp className="w-4 h-4 text-gray-400" />
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(candidate.recommended_role)}`}>
                            {getRoleIcon(candidate.recommended_role)}
                            <span className="ml-1">{candidate.recommended_role}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Attendance:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {candidate.attendance_rate}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Souls Won:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {candidate.soul_winning_count}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Member Since:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {new Date(candidate.church_joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-900 dark:text-blue-400">
                          <strong>Recommendation:</strong> {candidate.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePromotion(candidate.id, candidate.recommended_role)}
                      disabled={promoting === candidate.id}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {promoting === candidate.id ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Promote</span>
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promotion History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Promotions
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {promotionHistory.slice(0, 5).map((promotion) => (
              <div key={promotion.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {promotion.user?.full_name} promoted to {promotion.new_values?.role}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(promotion.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {promotionHistory.length === 0 && (
              <div className="text-center py-4">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No recent promotions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promotion Guidelines */}
      <div className="bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-400 mb-4">
          Promotion Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
              Newcomer → Member
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-1">
              <li>• 30+ days as newcomer</li>
              <li>• 75%+ attendance rate</li>
              <li>• Completed newcomer forms</li>
              <li>• Basic discipleship understanding</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
              Member → Worker
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-1">
              <li>• 90+ days as member</li>
              <li>• 85%+ attendance rate</li>
              <li>• 2+ souls won for Christ</li>
              <li>• Leadership potential demonstrated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}