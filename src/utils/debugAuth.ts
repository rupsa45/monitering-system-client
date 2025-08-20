import Cookies from 'js-cookie';
import { api } from '@/config/api';

export const debugAuth = {
  // Check if token exists in different storage locations
  checkTokenStorage: () => {
    console.log('🔍 Debugging Authentication Token Storage');
    console.log('==========================================');
    
    // Check cookies
    const cookieToken = Cookies.get('thisisjustarandomstring');
    console.log('📦 Cookie Token:', cookieToken ? 'EXISTS' : 'NOT FOUND');
    if (cookieToken) {
      try {
        const parsedToken = JSON.parse(cookieToken);
        console.log('📦 Parsed Cookie Token:', parsedToken ? 'VALID' : 'INVALID');
        console.log('📦 Token Length:', parsedToken?.length || 0);
      } catch (error) {
        console.log('📦 Cookie Token Parse Error:', error);
      }
    }
    
    // Check localStorage
    const localToken = localStorage.getItem('token');
    console.log('💾 LocalStorage Token:', localToken ? 'EXISTS' : 'NOT FOUND');
    
    // Check sessionStorage
    const sessionToken = sessionStorage.getItem('token');
    console.log('🗂️ SessionStorage Token:', sessionToken ? 'EXISTS' : 'NOT FOUND');
    
    // Check user data
    const userData = Cookies.get('user_data');
    console.log('👤 User Data Cookie:', userData ? 'EXISTS' : 'NOT FOUND');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('👤 User Role:', parsedUser?.empRole || 'UNKNOWN');
        console.log('👤 User Email:', parsedUser?.empEmail || 'UNKNOWN');
      } catch (error) {
        console.log('👤 User Data Parse Error:', error);
      }
    }
  },

  // Test API request with current token
  testApiRequest: async () => {
    console.log('🧪 Testing API Request');
    console.log('======================');
    
    try {
      // Test a simple endpoint that requires authentication
      const response = await api.get('/api/screenshots?page=1&limit=5');
      console.log('✅ API Request Successful');
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Data:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.log('❌ API Request Failed');
      console.log('📊 Error Status:', error.response?.status);
      console.log('📊 Error Message:', error.response?.data?.message || error.message);
      console.log('📊 Full Error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Test token extraction from axios interceptor
  testTokenExtraction: () => {
    console.log('🔧 Testing Token Extraction');
    console.log('===========================');
    
    // Simulate the token extraction logic from the axios interceptor
    const cookieToken = Cookies.get('thisisjustarandomstring');
    let token = null;
    
    if (cookieToken) {
      try {
        token = JSON.parse(cookieToken);
        console.log('✅ Token extracted from cookie successfully');
      } catch (error) {
        console.log('❌ Failed to parse token from cookie:', error);
      }
    }
    
    if (!token) {
      token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        console.log('✅ Token extracted from localStorage/sessionStorage');
      } else {
        console.log('❌ No token found in any storage');
      }
    }
    
    if (token) {
      console.log('🔑 Token found:', token.substring(0, 20) + '...');
      console.log('🔑 Token length:', token.length);
      console.log('🔑 Authorization header would be:', `Bearer ${token.substring(0, 20)}...`);
    }
    
    return token;
  },

  // Clear all authentication data
  clearAuthData: () => {
    console.log('🧹 Clearing All Authentication Data');
    console.log('===================================');
    
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    Cookies.remove('thisisjustarandomstring');
    Cookies.remove('user_data');
    
    console.log('✅ All authentication data cleared');
  },

  // Run full authentication debug
  runFullDebug: async () => {
    console.log('🚀 Running Full Authentication Debug');
    console.log('====================================');
    
    debugAuth.checkTokenStorage();
    debugAuth.testTokenExtraction();
    await debugAuth.testApiRequest();
    
    console.log('🏁 Debug Complete');
  }
};

// Export for use in components
export default debugAuth;
