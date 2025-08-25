import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target, Brain, ChevronLeft, ChevronRight, Zap, RefreshCw, X, Users, TrendingUp } from 'lucide-react';
import { fantasyAPI } from '../services/api';
import { Matchup, User, Roster, AIAnalysis, Player } from '../types';
import './Matchups.css';

const Matchups: React.FC = () => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState<any>(null);
  const [matchupAnalysis, setMatchupAnalysis] = useState<AIAnalysis | null>(null);
  const [matchupAnalysisLoading, setMatchupAnalysisLoading] = useState(false);
  const [matchupAnalysisError, setMatchupAnalysisError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});

  const refreshAIAnalysis = async () => {
    if (!matchups || !users || !rosters) return;
    
    setAiLoading(true);
    try {
      const analysis = await fantasyAPI.generateAIAnalysis(
        `Week ${currentWeek} Matchup Analysis`,
        { matchups, users, rosters, week: currentWeek },
        true // Force refresh
      );
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate AI analysis:', error);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchupData(currentWeek);
  }, [currentWeek]);

  const fetchMatchupData = async (week: number) => {
    setLoading(true);
    try {
      const [matchupsData, usersData, rostersData, playersData] = await Promise.all([
        fantasyAPI.getMatchups(week),
        fantasyAPI.getUsers(),
        fantasyAPI.getRosters(),
        fantasyAPI.getPlayers()
      ]);

      setMatchups(matchupsData);
      setUsers(usersData);
      setRosters(rostersData);
      setPlayers(playersData);

      // Generate AI analysis for matchups
      const analysis = await fantasyAPI.generateAIAnalysis(
        `Week ${week} Matchup Analysis`,
        { matchups: matchupsData, users: usersData, rosters: rostersData, week }
      );
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to fetch matchup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (rosterId: number) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    if (!roster) return `Team ${rosterId}`;
    
    const user = users.find(u => u.user_id === roster.owner_id);
    return user?.display_name || user?.username || `Team ${rosterId}`;
  };

  const getTeamPoints = (rosterId: number) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    return roster ? (roster.starters_points || []).reduce((sum, points) => sum + (points || 0), 0) : 0;
  };

  const getPlayerInfo = (playerId: string) => {
    return players?.[playerId] || null;
  };

  const handleMatchupClick = async (matchupGroup: any) => {
    setSelectedMatchup(matchupGroup);
    setMatchupAnalysisLoading(true);
    setMatchupAnalysisError(null);
    
    try {
      const [team1, team2] = matchupGroup.teams;
      const team1Roster = rosters.find(r => r.roster_id === team1.roster_id);
      const team2Roster = rosters.find(r => r.roster_id === team2.roster_id);
      
      console.log('Team 1 Roster:', team1Roster);
      console.log('Team 2 Roster:', team2Roster);
      
      // Get detailed player information for both teams
      const team1Players = (team1Roster?.starters || []).map(playerId => getPlayerInfo(playerId)).filter(Boolean);
      const team2Players = (team2Roster?.starters || []).map(playerId => getPlayerInfo(playerId)).filter(Boolean);
      
      console.log('Team 1 Players:', team1Players);
      console.log('Team 2 Players:', team2Players);
      
      const matchupData = {
        team1: {
          roster: team1Roster,
          players: team1Players,
          points: getTeamPoints(team1.roster_id),
          name: getTeamName(team1.roster_id)
        },
        team2: {
          roster: team2Roster,
          players: team2Players,
          points: getTeamPoints(team2.roster_id),
          name: getTeamName(team2.roster_id)
        },
        week: currentWeek
      };
      
      console.log('Matchup Data being sent to AI:', matchupData);
      
      const analysis = await fantasyAPI.generateAIAnalysis(
        `Detailed Matchup Analysis: ${matchupData.team1.name} vs ${matchupData.team2.name}`,
        matchupData,
        true // Force refresh for detailed analysis
      );
      
      console.log('AI Analysis Result:', analysis);
      setMatchupAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate matchup analysis:', error);
      console.error('Error details:', error);
      setMatchupAnalysisError('Failed to generate analysis. Please try again.');
    } finally {
      setMatchupAnalysisLoading(false);
    }
  };

  const groupedMatchups = matchups.reduce((acc, matchup) => {
    const existingMatchup = acc.find(m => m.matchup_id === matchup.matchup_id);
    if (existingMatchup) {
      existingMatchup.teams.push(matchup);
    } else {
      acc.push({ matchup_id: matchup.matchup_id, teams: [matchup] });
    }
    return acc;
  }, [] as { matchup_id: number; teams: Matchup[] }[]);

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? Math.max(1, currentWeek - 1) : Math.min(18, currentWeek + 1);
    setCurrentWeek(newWeek);
  };

  if (loading) {
    return (
      <div className="matchups-loading">
        <div className="spinner" />
        <p>Loading Week {currentWeek} matchups...</p>
      </div>
    );
  }

  return (
    <div className="matchups">
      <motion.div
        className="matchups-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-left">
            <Calendar className="header-icon" />
            <div>
              <h1>Week {currentWeek} Matchups</h1>
              <p>Fantasy Football 2025 Season</p>
            </div>
          </div>
          
          <div className="week-navigation">
            <button 
              className="btn btn-secondary"
              onClick={() => changeWeek('prev')}
              disabled={currentWeek === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <span className="week-display">Week {currentWeek}</span>
            
            <button 
              className="btn btn-secondary"
              onClick={() => changeWeek('next')}
              disabled={currentWeek === 18}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="matchups-grid">
        {/* Matchups List */}
        <motion.div
          className="matchups-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="section-header">
            <h2>Matchups</h2>
            <Target className="section-icon" />
          </div>

          <div className="matchups-container">
            {groupedMatchups.map((matchupGroup, index) => {
              const [team1, team2] = matchupGroup.teams;
              const team1Name = getTeamName(team1.roster_id);
              const team2Name = getTeamName(team2.roster_id);
              const team1Points = getTeamPoints(team1.roster_id);
              const team2Points = getTeamPoints(team2.roster_id);
              const winner = team1Points > team2Points ? team1Name : team2Name;

              return (
                <motion.div
                  key={matchupGroup.matchup_id}
                  className="matchup-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => handleMatchupClick(matchupGroup)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="matchup-header">
                    <span className="matchup-number">Matchup {index + 1}</span>
                    {winner && (
                      <span className="winner-badge">
                        <Zap size={12} />
                        {winner} leads
                      </span>
                    )}
                  </div>

                  <div className="teams-container">
                    <div className={`team ${team1Points > team2Points ? 'winning' : ''}`}>
                      <div className="team-info">
                        <h3>{team1Name}</h3>
                        <span className="team-points">{team1Points.toFixed(1)} pts</span>
                      </div>
                      <div className="team-score">
                        <span className="score">{team1Points.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="vs-divider">
                      <span>VS</span>
                    </div>

                    <div className={`team ${team2Points > team1Points ? 'winning' : ''}`}>
                      <div className="team-info">
                        <h3>{team2Name}</h3>
                        <span className="team-points">{team2Points.toFixed(1)} pts</span>
                      </div>
                      <div className="team-score">
                        <span className="score">{team2Points.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="matchup-stats">
                    <div className="stat">
                      <span className="stat-label">Point Difference</span>
                      <span className="stat-value">{Math.abs(team1Points - team2Points).toFixed(1)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Points</span>
                      <span className="stat-value">{(team1Points + team2Points).toFixed(1)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Analysis */}
        {aiAnalysis && (
          <motion.div
            className="matchup-analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="section-header">
              <h2>AI Analysis</h2>
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

            <div className="analysis-content">
              <div className="analysis-summary">
                <h3>🔥 Week {currentWeek} Battle Preview</h3>
                <p>{aiAnalysis.summary}</p>
              </div>

              <div className="analysis-insights">
                <h3>⚡ Key Matchup Insights</h3>
                <ul>
                  {aiAnalysis.keyInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="analysis-recommendations">
                <h3>🎯 Week {currentWeek} Strategy</h3>
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
      </div>

      {/* Detailed Matchup Modal */}
      {selectedMatchup && (
        <motion.div
          className="matchup-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedMatchup(null)}
        >
          <motion.div
            className="matchup-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🔥 Detailed Matchup Analysis</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedMatchup(null)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              {matchupAnalysisLoading ? (
                <div className="modal-loading">
                  <div className="spinner" />
                  <p>Analyzing matchup...</p>
                </div>
              ) : matchupAnalysisError ? (
                <div className="modal-error">
                  <p>{matchupAnalysisError}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleMatchupClick(selectedMatchup)}
                  >
                    Try Again
                  </button>
                </div>
              ) : matchupAnalysis ? (
                <div className="detailed-analysis">
                  <div className="matchup-summary">
                    <h3>🏈 Matchup Overview</h3>
                    <p>{matchupAnalysis.summary}</p>
                  </div>

                  <div className="analysis-grid">
                    <div className="analysis-section">
                      <h3>⚡ Key Insights</h3>
                      <ul>
                        {matchupAnalysis.keyInsights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="analysis-section">
                      <h3>🎯 Strategic Recommendations</h3>
                      <ul>
                        {matchupAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="confidence-meter">
                    <span>Analysis Confidence: {matchupAnalysis.confidence}/10</span>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ width: `${(matchupAnalysis.confidence / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-error">
                  <p>Failed to load detailed analysis</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleMatchupClick(selectedMatchup)}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Matchups;
