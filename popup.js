// Popup functionality
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const result = await chrome.storage.local.get(['supabase_token', 'user_id', 'user_email']);
  const isLoggedIn = result.supabase_token && result.user_id;
  
  if (isLoggedIn) {
    showStats(result.user_id, result.supabase_token);
  } else {
    showLogin();
  }
  
  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await handleLogin(email, password);
  });
  
  // Signup form
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    await handleSignup(email, password);
  });
  
  // Toggle between login and signup
  document.getElementById('toggleSignup').addEventListener('click', () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
  });
  
  document.getElementById('toggleLogin').addEventListener('click', () => {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['supabase_token']);
    if (result.supabase_token) {
      try {
        await signOut(result.supabase_token);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    await chrome.storage.local.remove(['supabase_token', 'user_id', 'user_email']);
    showLogin();
  });
});

async function handleLogin(email, password) {
  const loginBtn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('passwordError');
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  errorDiv.style.display = 'none';
  
  try {
    const response = await signIn(email, password);
    
    // Store auth token and user info (including Supabase config for content script)
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_ANON_KEY;
    
    await chrome.storage.local.set({
      supabase_token: response.access_token,
      user_id: response.user.id,
      user_email: response.user.email,
      supabase_url: supabaseUrl,
      supabase_key: supabaseKey
    });
    
    showStats(response.user.id, response.access_token);
  } catch (error) {
    errorDiv.textContent = error.message || 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleSignup(email, password) {
  const signupBtn = document.getElementById('signupBtn');
  const errorDiv = document.getElementById('signupPasswordError');
  
  signupBtn.disabled = true;
  signupBtn.textContent = 'Creating account...';
  errorDiv.style.display = 'none';
  
  try {
    const response = await signUp(email, password);
    
    // After signup, automatically sign in
    await handleLogin(email, password);
  } catch (error) {
    errorDiv.textContent = error.message || 'Signup failed. Please try again.';
    errorDiv.style.display = 'block';
    signupBtn.disabled = false;
    signupBtn.textContent = 'Sign Up';
  }
}

async function showStats(userId, accessToken) {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('statsSection').style.display = 'block';
  
  try {
    const stats = await getUserStats(accessToken, userId);
    document.getElementById('totalSaved').textContent = `$${stats.totalSaved.toFixed(2)}`;
    document.getElementById('totalAttempts').textContent = stats.totalAttempts;
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('totalSaved').textContent = '$0';
    document.getElementById('totalAttempts').textContent = '0';
  }
}

function showLogin() {
  document.getElementById('statsSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('signupForm').style.display = 'none';
}
