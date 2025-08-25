import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Target, Home } from 'lucide-react';
import { fantasyAPI } from '../services/api';
import { League } from '../types';
import './Header.css';

const Header: React.FC = () => {
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const leagueData = await fantasyAPI.getLeague();
        setLeague(leagueData);
      } catch (error) {
        console.error('Failed to fetch league:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/matchups', label: 'Matchups', icon: Target },
    { path: '/teams', label: 'Teams', icon: Users },
  ];

  return (
    <motion.header 
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <Trophy className="logo-icon" />
            <div className="logo-text">
              <h1 className="gradient-text">Fantasy25</h1>
              {league && (
                <p className="league-name">{league.name}</p>
              )}
            </div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    className="active-indicator"
                    layoutId="activeIndicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="header-right">
          {loading ? (
            <div className="spinner" />
          ) : (
            <div className="league-info">
              <span className="season">2025 Season</span>
              <span className="teams-count">{league?.total_rosters || 0} Teams</span>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
