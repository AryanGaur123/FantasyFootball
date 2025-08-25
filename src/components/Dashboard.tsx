import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Trophy, Target, Brain, Activity, RefreshCw } from 'lucide-react';
import { fantasyAPI } from '../services/api';
import { League, User, Roster, AIAnalysis } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [league, setLeague] = useState<League | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const refreshAIAnalysis = async () => {
    if (!league || !users || !rosters) return;
    
    setAiLoading(true);
    setAiError(null);
    try {
      const analysis = await fantasyAPI.generateAIAnalysis(
        'League Overview and Standings Analysis',
        { league, users, rosters },
        true // Force refresh
      );
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate AI analysis:', error);
      setAiError('Failed to generate AI analysis. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leagueData, usersData, rostersData] = await Promise.all([
          fantasyAPI.getLeague(),
          fantasyAPI.getUsers(),
          fantasyAPI.getRosters()
        ]);

        setLeague(leagueData);
        setUsers(usersData);
        setRosters(rostersData);

        // Generate AI analysis
        setAiLoading(true);
        setAiError(null);
        try {
          const analysis = await fantasyAPI.generateAIAnalysis(
            'League Overview and Standings Analysis',
            { league: leagueData, users: usersData, rosters: rostersData }
          );
          setAiAnalysis(analysis);
        } catch (error) {
          console.error('Failed to generate AI analysis:', error);
          setAiError('Failed to generate AI analysis. Please try again.');
        } finally {
          setAiLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTeamName = (roster: Roster) => {
    const user = users.find(u => u.user_id === roster.owner_id);
    return user?.display_name || user?.username || `Team ${roster.roster_id}`;
  };

  // Add safety check for empty rosters array
  if (!rosters || rosters.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading league data...</p>
      </div>
    );
  }

  const sortedRosters = rosters
    .map(roster => ({
      ...roster,
      teamName: getTeamName(roster),
      totalPoints: (roster.starters_points || []).reduce((sum, points) => sum + (points || 0), 0)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading your fantasy football dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>League Dashboard</h1>
        <p>Welcome to your 2025 Fantasy Football season!</p>
      </motion.div>

      <div className="dashboard-grid">
        {/* League Stats Cards */}
        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="stat-card">
            <div className="stat-icon">
              <Users />
            </div>
            <div className="stat-content">
              <h3>{league?.total_rosters || 0}</h3>
              <p>Teams</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Trophy />
            </div>
            <div className="stat-content">
              <h3>{league?.season || '2025'}</h3>
              <p>Season</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Activity />
            </div>
            <div className="stat-content">
              <h3>{league?.status || 'Active'}</h3>
              <p>Status</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Target />
            </div>
            <div className="stat-content">
              <h3>{sortedRosters.length > 0 ? sortedRosters[0].teamName : 'N/A'}</h3>
              <p>Leader</p>
            </div>
          </div>
        </motion.div>

        {/* Standings */}
        <motion.div
          className="standings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="section-header">
            <h2>League Standings</h2>
            <TrendingUp className="section-icon" />
          </div>
          
          <div className="standings-table">
            <div className="table-header">
              <span>Rank</span>
              <span>Team</span>
              <span>Points</span>
              <span>Record</span>
            </div>
            
            {sortedRosters.map((roster, index) => (
              <motion.div
                key={roster.roster_id}
                className={`table-row ${index < 3 ? 'top-three' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <span className="rank">{index + 1}</span>
                <span className="team-name">{roster.teamName}</span>
                <span className="points">{roster.totalPoints.toFixed(1)}</span>
                <span className="record">0-0</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Analysis */}
        <motion.div
          className="ai-analysis-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="section-header">
            <h2>AI Insights</h2>
            <div className="section-header-right">
              <Brain className="section-icon" />
              <button 
                className="btn btn-secondary refresh-btn"
                onClick={refreshAIAnalysis}
                disabled={aiLoading}
                title="Refresh AI Analysis"
              >
                <RefreshCw size={16} className={aiLoading ? 'spinning' : ''} />
                Refresh
              </button>
            </div>
          </div>
          
          {aiLoading && (
            <div className="ai-loading">
              <div className="spinner" />
              <p>Generating AI analysis...</p>
            </div>
          )}
          
          {aiError && (
            <div className="ai-error">
              <p>{aiError}</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}
          
          {aiAnalysis && !aiLoading && !aiError && (
            <div className="ai-content">
              <div className="ai-summary">
                <h3>🏆 Championship Outlook</h3>
                <p>{aiAnalysis.summary}</p>
              </div>
              
              <div className="ai-insights">
                <h3>🎯 Key Predictions</h3>
                <ul>
                  {aiAnalysis.keyInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
              
              <div className="ai-recommendations">
                <h3>💡 Strategic Advice</h3>
                <ul>
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="confidence-meter">
                <span>Analysis Confidence: {aiAnalysis.confidence}/10</span>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${(aiAnalysis.confidence / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
