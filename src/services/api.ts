import axios from 'axios';
import { League, User, Roster, Matchup, Player, AIAnalysis } from '../types';

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
const GOOGLE_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent';

const LEAGUE_ID = process.env.REACT_APP_SLEEPER_LEAGUE_ID;
const DRAFT_ID = process.env.REACT_APP_SLEEPER_DRAFT_ID;
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_AI_API_KEY;

class FantasyAPI {
  private sleeperApi = axios.create({
    baseURL: SLEEPER_BASE_URL,
  });

  private googleAiApi = axios.create({
    baseURL: GOOGLE_AI_URL,
    params: { key: GOOGLE_API_KEY },
  });

  async getLeague(): Promise<League> {
    const response = await this.sleeperApi.get(`/league/${LEAGUE_ID}`);
    return response.data;
  }

  async getUsers(): Promise<User[]> {
    const response = await this.sleeperApi.get(`/league/${LEAGUE_ID}/users`);
    return response.data;
  }

  async getRosters(): Promise<Roster[]> {
    const response = await this.sleeperApi.get(`/league/${LEAGUE_ID}/rosters`);
    return response.data;
  }

  async getMatchups(week: number): Promise<Matchup[]> {
    const response = await this.sleeperApi.get(`/league/${LEAGUE_ID}/matchups/${week}`);
    return response.data;
  }

  async getPlayers(): Promise<Record<string, Player>> {
    const response = await this.sleeperApi.get('/players/nfl');
    return response.data;
  }

  async getDraft(): Promise<any> {
    const response = await this.sleeperApi.get(`/draft/${DRAFT_ID}`);
    return response.data;
  }

  async getDraftPicks(): Promise<any[]> {
    const response = await this.sleeperApi.get(`/draft/${DRAFT_ID}/picks`);
    return response.data;
  }

  // Fallback analysis when API is unavailable
  private generateFallbackAnalysis(context: string, data: any): AIAnalysis {
    if (context.includes('Matchup')) {
      const teamNames = this.extractTeamNames(data);
      return {
        summary: `This is a classic fantasy football showdown between ${teamNames.team1 || 'Team A'} and ${teamNames.team2 || 'Team B'}. Both teams have their strengths, but this matchup could go either way depending on player performance.`,
        keyInsights: [
          `${teamNames.team1 || 'Team A'} has a solid roster with good depth at key positions.`,
          `${teamNames.team2 || 'Team B'} shows strong potential with their starting lineup.`,
          "The outcome will likely hinge on which team's players have better matchups this week.",
          "Both teams should focus on optimizing their lineups for maximum points."
        ],
        recommendations: [
          "Check player injury reports and weather conditions before finalizing lineups.",
          "Consider streaming options for positions with favorable matchups.",
          "Monitor late-breaking news for any last-minute roster changes."
        ],
        confidence: 6
      };
    } else if (context.includes('Team Analysis')) {
      const teamName = this.extractTeamName(data);
      return {
        summary: `${teamName || 'This team'} has a well-rounded roster with potential for success this season. The team's performance will depend on key players staying healthy and performing consistently.`,
        keyInsights: [
          "The roster shows good balance across different positions.",
          "There are some high-upside players who could carry the team to victory.",
          "Depth at key positions provides flexibility for lineup decisions.",
          "The team should focus on consistent performers rather than boom-or-bust players."
        ],
        recommendations: [
          "Consider trading for players with more consistent weekly production.",
          "Monitor the waiver wire for emerging talent to improve depth.",
          "Stay active in trade discussions to address any roster weaknesses."
        ],
        confidence: 7
      };
    } else {
      return {
        summary: "Fantasy football analysis shows an exciting season ahead with competitive matchups and strategic opportunities for all teams.",
        keyInsights: [
          "Teams with strong quarterback play have a significant advantage.",
          "Running back depth is crucial for consistent weekly performance.",
          "Wide receiver depth provides flexibility for different scoring formats.",
          "Active roster management is key to fantasy success."
        ],
        recommendations: [
          "Stay active on the waiver wire to improve roster depth.",
          "Monitor player trends and adjust strategies accordingly.",
          "Don't be afraid to make bold trades to improve your team."
        ],
        confidence: 8
      };
    }
  }

  private extractTeamNames(data: any): { team1: string, team2: string } {
    try {
      if (data.team1?.name && data.team2?.name) {
        return { team1: data.team1.name, team2: data.team2.name };
      }
      return { team1: 'Team A', team2: 'Team B' };
    } catch {
      return { team1: 'Team A', team2: 'Team B' };
    }
  }

  private extractTeamName(data: any): string {
    try {
      if (data.team?.name) return data.team.name;
      if (data.name) return data.name;
      return 'This team';
    } catch {
      return 'This team';
    }
  }

  async generateAIAnalysis(context: string, data: any, forceRefresh: boolean = false): Promise<AIAnalysis> {
    // Create a cache key based on context and data
    const cacheKey = `ai_analysis_${context.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          const cacheAge = Date.now() - parsedCache.timestamp;
          // Cache is valid for 1 hour (3600000 ms)
          if (cacheAge < 3600000) {
            console.log('Using cached AI analysis');
            return parsedCache.data;
          }
        } catch (error) {
          console.log('Cache corrupted, generating new analysis');
        }
      }
    }
    let prompt = '';
    
    if (context.includes('League Overview')) {
      prompt = `
        You are a fantasy football expert analyst. Based on the league data provided, give insights about:
        
        Context: ${context}
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Who might be the early favorites to win the league based on team names and any available data
        2. Interesting observations about team strategies or compositions
        3. Potential dark horse teams that could surprise everyone
        4. General fantasy football wisdom for the 2025 season
        
        IMPORTANT TEAM INSIGHTS TO INCLUDE:
        - "aryangaur" and "tahamo" are strong contenders with excellent team compositions
        - "arsh" appears to have a weak team that will likely struggle this season
        - These predictions are based on early roster analysis and team strategies
        
        Please provide:
        1. A concise summary about the league's competitive landscape (2-3 sentences)
        2. 3-4 key insights about potential winners and interesting team dynamics
        3. 2-3 strategic recommendations for fantasy success in 2025
        4. Confidence level (1-10)
        
        Format your response as JSON with keys: summary (string), keyInsights (array of strings), recommendations (array of strings), confidence (number)
        
        IMPORTANT: keyInsights and recommendations must be arrays of strings, not objects. Each item should be a complete sentence.
        
        Make it engaging and fun - this is for a fantasy football league!
      `;
    } else if (context.includes('Matchup')) {
      prompt = `
        You are a fantasy football expert analyst. Analyze this matchup:
        
        Context: ${context}
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Head-to-head comparison of the two teams
        2. Key player matchups and their impact
        3. Team strengths and weaknesses
        4. Prediction for who will win and why
        5. Strategic advice for both teams
        
        IMPORTANT TEAM INSIGHTS TO INCLUDE:
        - "aryangaur" and "tahamo" are strong contenders with excellent team compositions
        - "arsh" appears to have a weak team that will likely struggle this season
        - These predictions are based on early roster analysis and team strategies
        
        Please provide:
        1. A concise summary of the matchup and prediction (2-3 sentences)
        2. 3-4 key insights about the teams and key factors
        3. 2-3 strategic recommendations for the matchup
        4. Confidence level (1-10)
        
        Format your response as JSON with keys: summary (string), keyInsights (array of strings), recommendations (array of strings), confidence (number)
        
        IMPORTANT: keyInsights and recommendations must be arrays of strings, not objects. Each item should be a complete sentence.
        
        Make it exciting and competitive!
      `;
    } else if (context.includes('Team Analysis')) {
      prompt = `
        You are a fantasy football expert analyst. Analyze this specific team:
        
        Context: ${context}
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. The team's strengths and potential weaknesses
        2. Key players who could carry the team to victory
        3. Strategic moves they should consider
        4. Their championship potential
        
        IMPORTANT TEAM INSIGHTS TO INCLUDE:
        - "aryangaur" and "tahamo" are strong contenders with excellent team compositions
        - "arsh" appears to have a weak team that will likely struggle this season
        - These predictions are based on early roster analysis and team strategies
        
        Please provide:
        1. A concise summary of the team's outlook (2-3 sentences)
        2. 3-4 key insights about the team's potential and strategy
        3. 2-3 recommendations for improving their roster
        4. Confidence level (1-10)
        
        Format your response as JSON with keys: summary (string), keyInsights (array of strings), recommendations (array of strings), confidence (number)
        
        IMPORTANT: keyInsights and recommendations must be arrays of strings, not objects. Each item should be a complete sentence.
        
        Be specific and actionable!
      `;
    } else {
      prompt = `
        You are a fantasy football expert analyst. Analyze the following data and provide insights:
        
        Context: ${context}
        Data: ${JSON.stringify(data, null, 2)}
        
        Please provide:
        1. A concise summary (2-3 sentences)
        2. 3-4 key insights
        3. 2-3 actionable recommendations
        4. Confidence level (1-10)
        
        Format your response as JSON with keys: summary (string), keyInsights (array of strings), recommendations (array of strings), confidence (number)
        
        IMPORTANT: keyInsights and recommendations must be arrays of strings, not objects. Each item should be a complete sentence.
      `;
    }

    try {
      console.log('Sending AI request with prompt:', prompt);
      
      const response = await this.googleAiApi.post('', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      });

      console.log('AI Response received:', response.data);
      
      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('No candidates in AI response');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      console.log('AI Response text:', aiResponse);
      
      // Try to extract JSON from the response (it might be wrapped in markdown)
      let jsonText = aiResponse;
      if (aiResponse.includes('```json')) {
        jsonText = aiResponse.split('```json')[1].split('```')[0];
      } else if (aiResponse.includes('```')) {
        jsonText = aiResponse.split('```')[1];
      }
      
      console.log('Extracted JSON text:', jsonText);
      
      const parsed = JSON.parse(jsonText.trim());
      console.log('Parsed AI analysis:', parsed);
      
      // Validate and clean the response
      const validated = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis summary unavailable',
        keyInsights: Array.isArray(parsed.keyInsights) 
          ? parsed.keyInsights.map((item: any) => typeof item === 'string' ? item : JSON.stringify(item)).filter(Boolean)
          : ['Key insights unavailable'],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map((item: any) => typeof item === 'string' ? item : JSON.stringify(item)).filter(Boolean)
          : ['Recommendations unavailable'],
        confidence: typeof parsed.confidence === 'number' ? Math.min(10, Math.max(1, parsed.confidence)) : 5
      };
      
      console.log('Validated AI analysis:', validated);
      
      // Cache the result
      const cacheData = {
        data: validated,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      return validated;
    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Check if it's a quota exceeded error
      const errorData = error.response?.data;
      if (errorData?.error?.code === 429 || errorData?.error?.message?.includes('quota')) {
        console.log('API quota exceeded, using fallback analysis');
        return this.generateFallbackAnalysis(context, data);
      }
      
      // For other errors, also use fallback
      console.log('Using fallback analysis due to API error');
      return this.generateFallbackAnalysis(context, data);
    }
  }
}

export const fantasyAPI = new FantasyAPI();
export default fantasyAPI;
