// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com -> Your Project -> Settings -> API

const SUPABASE_URL = 'https://dsdklfeoptidhzlmdnss.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZGtsZmVvcHRpZGh6bG1kbnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjI1OTQsImV4cCI6MjA4MTkzODU5NH0.O7GGBobY0zq2wNtd9qgFf7n0TnxuZsMppfgISj7TwRk';

// Initialize Supabase client
// Note: We'll use fetch API since we can't use the Supabase JS library directly in extensions
// We'll make direct HTTP requests to Supabase REST API

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Supabase request error:', error);
    throw error;
  }
}

async function supabaseAuth(endpoint, data) {
  const url = `${SUPABASE_URL}/auth/v1${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error_description || result.message || 'Auth failed');
    }
    
    return result;
  } catch (error) {
    console.error('Supabase auth error:', error);
    throw error;
  }
}

// Auth functions
async function signUp(email, password) {
  return await supabaseAuth('/signup', {
    email,
    password
  });
}

async function signIn(email, password) {
  return await supabaseAuth('/token?grant_type=password', {
    email,
    password
  });
}

async function signOut(accessToken) {
  const url = `${SUPABASE_URL}/auth/v1/logout`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// Data functions
async function savePurchaseAttempt(accessToken, data) {
  return await supabaseRequest('/purchase_attempts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  });
}

async function getUserStats(accessToken, userId) {
  // Get total saved amount and count
  const response = await fetch(`${SUPABASE_URL}/rest/v1/purchase_attempts?user_id=eq.${userId}&select=amount_saved`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  const totalSaved = data.reduce((sum, item) => sum + (item.amount_saved || 0), 0);
  const totalAttempts = data.length;
  
  return { totalSaved, totalAttempts };
}

