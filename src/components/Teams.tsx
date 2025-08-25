import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Brain, User, Trophy, Target } from 'lucide-react';
import { fantasyAPI } from '../services/api';
import { User as UserType, Roster, Player, AIAnalysis } from '../types';
import './Teams.css';

const Teams: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [selectedTeam, setSelectedTeam] = useState<Roster | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      generateTeamAnalysis(selectedTeam);
    }
  }, [selectedTeam, users, players]);

  const fetchTeamData = async () => {
    try {
      const [usersData, rostersData, playersData] = await Promise.all([
        fantasyAPI.getUsers(),
        fantasyAPI.getRosters(),
        fantasyAPI.getPlayers()
      ]);

      setUsers(usersData);
      setRosters(rostersData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTeamAnalysis = async (roster: Roster) => {
    try {
      const user = users.find(u => u.user_id === roster.owner_id);
      const teamPlayers = roster.players.map(playerId => players[playerId]).filter(Boolean);
      
      const analysis = await fantasyAPI.generateAIAnalysis(
        `Team Analysis for ${user?.display_name || user?.username}`,
        { roster, user, players: teamPlayers }
      );
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate team analysis:', error);
    }
  };

  const getTeamName = (roster: Roster) => {
    const user = users.find(u => u.user_id === roster.owner_id);
    return user?.display_name || user?.username || `Team ${roster.roster_id}`;
  };

  const getTeamPoints = (roster: Roster) => {
    return (roster.starters_points || []).reduce((sum, points) => sum + (points || 0), 0);
  };

  const filteredRosters = (rosters || []).filter(roster => {
    const teamName = getTeamName(roster).toLowerCase();
    return teamName.includes(searchTerm.toLowerCase());
  });

  const sortedRosters = filteredRosters.sort((a, b) => getTeamPoints(b) - getTeamPoints(a));

  const getPlayerInfo = (playerId: string) => {
    return players?.[playerId] || null;
  };

  if (loading || !players) {
    return (
      <div className="teams-loading">
        <div className="spinner" />
        <p>Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="teams">
      <motion.div
        className="teams-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-left">
            <Users className="header-icon" />
            <div>
              <h1>Team Rosters</h1>
              <p>Fantasy Football 2025 Season</p>
            </div>
          </div>
          
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </motion.div>

      <div className="teams-grid">
        {/* Teams List */}
        <motion.div
          className="teams-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="section-header">
            <h2>All Teams</h2>
            <Trophy className="section-icon" />
          </div>

          <div className="teams-container">
            {sortedRosters.map((roster, index) => {
              const teamName = getTeamName(roster);
              const teamPoints = getTeamPoints(roster);
              const isSelected = selectedTeam?.roster_id === roster.roster_id;

              return (
                <motion.div
                  key={roster.roster_id}
                  className={`team-card ${isSelected ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => setSelectedTeam(roster)}
                >
                  <div className="team-header">
                    <div className="team-rank">#{index + 1}</div>
                    <div className="team-info">
                      <h3>{teamName}</h3>
                      <span className="team-points">{teamPoints.toFixed(1)} pts</span>
                    </div>
                    <div className="team-stats">
                      <div className="stat">
                        <span className="stat-label">Players</span>
                        <span className="stat-value">{roster.players?.length || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Starters</span>
                        <span className="stat-value">{roster.starters?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Team Details */}
        {selectedTeam && (
          <motion.div
            className="team-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="section-header">
              <h2>Team Details</h2>
              <Target className="section-icon" />
            </div>

            <div className="team-overview">
              <div className="team-header-detail">
                <User className="team-avatar" />
                <div>
                  <h3>{getTeamName(selectedTeam)}</h3>
                  <p>Roster #{selectedTeam.roster_id}</p>
                </div>
              </div>

              <div className="team-stats-grid">
                <div className="stat-card">
                  <span className="stat-number">{getTeamPoints(selectedTeam).toFixed(1)}</span>
                  <span className="stat-label">Total Points</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{selectedTeam.players.length}</span>
                  <span className="stat-label">Total Players</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{selectedTeam.starters?.length || 0}</span>
                  <span className="stat-label">Starters</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{selectedTeam.reserve?.length || 0}</span>
                  <span className="stat-label">Bench</span>
                </div>
              </div>
            </div>

            <div className="roster-sections">
              <div className="roster-section">
                <h3>Starters</h3>
                <div className="players-list">
                  {(selectedTeam.starters || []).map((playerId, index) => {
                    const player = getPlayerInfo(playerId);
                    if (!player) return null;

                    return (
                      <div key={playerId} className="player-card starter">
                        <div className="player-info">
                          <h4>{player.first_name} {player.last_name}</h4>
                          <span className="player-position">{player.position} • {player.team}</span>
                        </div>
                        <div className="player-points">
                          {selectedTeam.players_points?.[playerId]?.toFixed(1) || '0.0'} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="roster-section">
                <h3>Bench</h3>
                <div className="players-list">
                  {(selectedTeam.reserve || []).map((playerId) => {
                    const player = getPlayerInfo(playerId);
                    if (!player) return null;

                    return (
                      <div key={playerId} className="player-card bench">
                        <div className="player-info">
                          <h4>{player.first_name} {player.last_name}</h4>
                          <span className="player-position">{player.position} • {player.team}</span>
                        </div>
                        <div className="player-points">
                          {selectedTeam.players_points?.[playerId]?.toFixed(1) || '0.0'} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {aiAnalysis && (
              <motion.div
                className="team-analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="section-header">
                  <h2>AI Analysis</h2>
                  <Brain className="section-icon" />
                </div>

                <div className="analysis-content">
                  <div className="analysis-summary">
                    <h3>👑 Team Championship Potential</h3>
                    <p>{aiAnalysis.summary}</p>
                  </div>

                  <div className="analysis-insights">
                    <h3>🔍 Roster Analysis</h3>
                    <ul>
                      {aiAnalysis.keyInsights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-recommendations">
                    <h3>🚀 Improvement Strategy</h3>
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
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Teams;
