import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// $5 free credit = roughly 3.3M tokens at $0.0015 per 1K tokens
const MONTHLY_TOKEN_LIMIT = 3_300_000;  // Total tokens for the free trial period
const DAILY_TOKEN_LIMIT = 110_000;      // ~$0.16 worth of tokens per day to spread usage
const USER_DAILY_LIMIT = 10;            // Maximum requests per user per day
const TOKEN_BUFFER = 0.1;               // 10% buffer to account for token counting inaccuracy

// Rough token count estimation
function estimateTokenCount(text: string): number {
  // GPT models typically use ~4 chars per token
  return Math.ceil(text.length / 4);
}

export const usageService = {
  async checkAndUpdateUsage(userId: string, inputText: string): Promise<{ 
    canProceed: boolean; 
    message?: string;
  }> {
    try {
      // Get the current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7); // YYYY-MM format

      // References to usage documents
      const monthlyUsageRef = doc(db, 'usage', month);
      const dailyUsageRef = doc(db, 'usage', today);
      const userDailyUsageRef = doc(db, 'usage', `${today}_${userId}`);

      // Get current usage
      const [monthlyDoc, dailyDoc, userDailyDoc] = await Promise.all([
        getDoc(monthlyUsageRef),
        getDoc(dailyUsageRef),
        getDoc(userDailyUsageRef)
      ]);

      const monthlyTokens = monthlyDoc.exists() ? monthlyDoc.data().tokens || 0 : 0;
      const dailyTokens = dailyDoc.exists() ? dailyDoc.data().tokens || 0 : 0;
      const userRequests = userDailyDoc.exists() ? userDailyDoc.data().requests || 0 : 0;

      // Estimate tokens for this request
      const estimatedTokens = estimateTokenCount(inputText);

      // Check limits
      if (monthlyTokens + estimatedTokens > MONTHLY_TOKEN_LIMIT) {
        return {
          canProceed: false,
          message: 'Monthly usage limit reached. Please try again next month.'
        };
      }

      if (dailyTokens + estimatedTokens > DAILY_TOKEN_LIMIT) {
        return {
          canProceed: false,
          message: 'Daily platform limit reached. Please try again tomorrow.'
        };
      }

      if (userRequests >= USER_DAILY_LIMIT) {
        return {
          canProceed: false,
          message: `You've reached your daily limit of ${USER_DAILY_LIMIT} requests. Please try again tomorrow.`
        };
      }

      // If we're approaching limits, send a warning
      let warning = '';
      if (monthlyTokens > MONTHLY_TOKEN_LIMIT * 0.9) {
        warning = 'Warning: Approaching monthly usage limit.';
      } else if (dailyTokens > DAILY_TOKEN_LIMIT * 0.9) {
        warning = 'Warning: Approaching daily platform limit.';
      } else if (userRequests >= USER_DAILY_LIMIT - 2) {
        warning = `Warning: You have ${USER_DAILY_LIMIT - userRequests} requests remaining today.`;
      }

      // Store the estimated tokens for this request for potential revert
      try {
        localStorage.setItem(`lastRequest_${userId}`, JSON.stringify({
          date: today,
          month: month,
          tokens: estimatedTokens
        }));
      } catch (e) {
        console.error('Error saving last request info to localStorage:', e);
      }

      // Update usage counts
      await Promise.all([
        setDoc(monthlyUsageRef, { tokens: increment(estimatedTokens) }, { merge: true }),
        setDoc(dailyUsageRef, { tokens: increment(estimatedTokens) }, { merge: true }),
        setDoc(userDailyUsageRef, { requests: increment(1) }, { merge: true })
      ]);

      return {
        canProceed: true,
        message: warning || undefined
      };
    } catch (error) {
      console.error('Error checking usage:', error);
      // If we can't check usage, err on the side of caution
      return {
        canProceed: false,
        message: 'Unable to verify usage limits. Please try again later.'
      };
    }
  },

  async revertLastUsage(userId: string): Promise<boolean> {
    try {
      // Get the last request info from localStorage
      const lastRequestJSON = localStorage.getItem(`lastRequest_${userId}`);
      if (!lastRequestJSON) {
        console.warn('No last request info found for revert');
        return false;
      }

      const lastRequest = JSON.parse(lastRequestJSON);
      const { date, month, tokens } = lastRequest;

      // References to usage documents
      const monthlyUsageRef = doc(db, 'usage', month);
      const dailyUsageRef = doc(db, 'usage', date);
      const userDailyUsageRef = doc(db, 'usage', `${date}_${userId}`);

      // Revert usage counts
      await Promise.all([
        updateDoc(monthlyUsageRef, { tokens: increment(-tokens) }),
        updateDoc(dailyUsageRef, { tokens: increment(-tokens) }),
        updateDoc(userDailyUsageRef, { requests: increment(-1) })
      ]);

      // Clear the last request info
      localStorage.removeItem(`lastRequest_${userId}`);
      
      console.log('Successfully reverted usage for failed request');
      return true;
    } catch (error) {
      console.error('Error reverting usage:', error);
      return false;
    }
  },

  async getUserDailyUsage(userId: string): Promise<{
    requestsToday: number;
    remainingRequests: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const userDailyDoc = await getDoc(doc(db, 'usage', `${today}_${userId}`));
    const requestsToday = userDailyDoc.exists() ? userDailyDoc.data().requests || 0 : 0;
    
    return {
      requestsToday,
      remainingRequests: USER_DAILY_LIMIT - requestsToday
    };
  },
  
  // Alias for getUserDailyUsage to match the function name used in AIStudyAssistant
  async getUserUsage(userId: string): Promise<{
    requestsToday: number;
    remainingRequests: number;
  }> {
    return this.getUserDailyUsage(userId);
  }
}; 