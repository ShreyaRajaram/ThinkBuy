// Web App JavaScript
let currentUser = null;
let accessToken = null;
let savingsChart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const token = localStorage.getItem('supabase_token');
  const userId = localStorage.getItem('user_id');
  
  if (token && userId) {
    accessToken = token;
    currentUser = { id: userId };
    showDashboard();
    loadDashboardData();
  } else {
    showLogin();
  }
  
  setupEventListeners();
});

function setupEventListeners() {
  // Login form
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
  
  // Toggle between login/signup
  document.getElementById('showSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
  });
  
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  });
  
  // Navigation
  document.getElementById('dashboardLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showDashboard();
    loadDashboardData();
  });
  
  document.getElementById('settingsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSettings();
    loadSettings();
  });
  
  document.getElementById('dashboardLinkSettings')?.addEventListener('click', (e) => {
    e.preventDefault();
    showDashboard();
    loadDashboardData();
  });
  
  document.getElementById('settingsLinkSettings')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSettings();
    loadSettings();
  });
  
  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('logoutBtnSettings')?.addEventListener('click', handleLogout);
  
  // Settings
  document.getElementById('toggleAll')?.addEventListener('change', handleToggleAll);
  document.getElementById('addSiteBtn')?.addEventListener('click', () => {
    document.getElementById('addSiteModal').style.display = 'flex';
  });
  
  document.getElementById('cancelAddSite')?.addEventListener('click', () => {
    document.getElementById('addSiteModal').style.display = 'none';
    document.getElementById('siteUrl').value = '';
  });
  
  document.getElementById('saveSite')?.addEventListener('click', handleAddSite);
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('errorMessage');
  
  try {
    const response = await signIn(email, password);
    
    accessToken = response.access_token;
    currentUser = { id: response.user.id, email: response.user.email };
    
    localStorage.setItem('supabase_token', accessToken);
    localStorage.setItem('user_id', response.user.id);
    localStorage.setItem('user_email', response.user.email);
    
    showDashboard();
    loadDashboardData();
  } catch (error) {
    errorDiv.textContent = error.message || 'Login failed. Please try again.';
    errorDiv.classList.add('show');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const errorDiv = document.getElementById('errorMessage');
  
  try {
    await signUp(email, password);
    // Auto login after signup
    await handleLogin(e);
  } catch (error) {
    errorDiv.textContent = error.message || 'Signup failed. Please try again.';
    errorDiv.classList.add('show');
  }
}

async function handleLogout() {
  if (accessToken) {
    try {
      await signOut(accessToken);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  localStorage.removeItem('supabase_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  
  accessToken = null;
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('dashboardPage').classList.remove('active');
  document.getElementById('settingsPage').classList.remove('active');
}

function showDashboard() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('dashboardPage').classList.add('active');
  document.getElementById('settingsPage').classList.remove('active');
}

function showSettings() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('dashboardPage').classList.remove('active');
  document.getElementById('settingsPage').classList.add('active');
}

async function loadDashboardData() {
  if (!accessToken || !currentUser) return;
  
  try {
    // Get all purchase attempts
    const response = await fetch(`${SUPABASE_URL}/rest/v1/purchase_attempts?user_id=eq.${currentUser.id}&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Calculate stats
    const totalSaved = data.reduce((sum, item) => sum + (item.amount_saved || 0), 0);
    const totalAttempts = data.length;
    
    // This month's savings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyData = data.filter(item => new Date(item.created_at) >= startOfMonth);
    const monthlySaved = monthlyData.reduce((sum, item) => sum + (item.amount_saved || 0), 0);
    
    // Average saved
    const avgSaved = totalAttempts > 0 ? totalSaved / totalAttempts : 0;
    
    // Update UI
    document.getElementById('totalSaved').textContent = `$${totalSaved.toFixed(2)}`;
    document.getElementById('totalAttempts').textContent = totalAttempts;
    document.getElementById('monthlySaved').textContent = `$${monthlySaved.toFixed(2)}`;
    document.getElementById('avgSaved').textContent = `$${avgSaved.toFixed(2)}`;
    
    // Show recent activity (last 10)
    const recentActivity = document.getElementById('recentActivity');
    recentActivity.innerHTML = '';
    
    if (data.length === 0) {
      recentActivity.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">No activity yet. Start shopping to see your savings!</p>';
    } else {
      data.slice(0, 10).forEach(item => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
          <div class="activity-info">
            <div class="activity-product">${item.product_name || 'Unknown Product'}</div>
            <div class="activity-meta">${formatDate(item.created_at)} • ${extractDomain(item.website_url)}</div>
          </div>
          <div class="activity-amount">$${(item.amount_saved || 0).toFixed(2)}</div>
        `;
        recentActivity.appendChild(activityItem);
      });
    }
    
    // Create/update chart
    createSavingsChart(data);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function createSavingsChart(data) {
  const ctx = document.getElementById('savingsChart');
  if (!ctx) return;
  
  // Process data for the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Group data by date
  const dailyData = {};
  const filteredData = data.filter(item => new Date(item.created_at) >= thirtyDaysAgo);
  
  filteredData.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyData[date]) {
      dailyData[date] = 0;
    }
    dailyData[date] += item.amount_saved || 0;
  });
  
  // Create cumulative totals
  const sortedDates = Object.keys(dailyData).sort((a, b) => {
    return new Date(a + ', ' + new Date().getFullYear()) - new Date(b + ', ' + new Date().getFullYear());
  });
  
  let cumulative = 0;
  const labels = [];
  const cumulativeData = [];
  const dailyAmounts = [];
  
  sortedDates.forEach(date => {
    cumulative += dailyData[date];
    labels.push(date);
    cumulativeData.push(cumulative);
    dailyAmounts.push(dailyData[date]);
  });
  
  // Destroy existing chart if it exists
  if (savingsChart) {
    savingsChart.destroy();
  }
  
  // Create new chart
  savingsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['No data yet'],
      datasets: [
        {
          label: 'Cumulative Savings',
          data: cumulativeData.length > 0 ? cumulativeData : [0],
          borderColor: '#ed35bc',
          backgroundColor: 'rgba(237, 53, 188, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ed35bc',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Daily Savings',
          data: dailyAmounts.length > 0 ? dailyAmounts : [0],
          borderColor: '#f8a5c2',
          backgroundColor: 'rgba(248, 165, 194, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#f8a5c2',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#5a3a4a',
            font: {
              size: 12,
              weight: '500'
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#5a3a4a',
          borderColor: '#f8a5c2',
          borderWidth: 2,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            },
            callback: function(value) {
              return '$' + value.toFixed(0);
            }
          },
          grid: {
            color: 'rgba(248, 165, 194, 0.2)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            }
          },
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

async function loadSettings() {
  if (!accessToken || !currentUser) return;
  
  try {
    // Get user's site settings
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${currentUser.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const settings = await response.json();
    
    // Load custom sites
    const customSitesDiv = document.getElementById('customSites');
    customSitesDiv.innerHTML = '';
    
    if (settings.length > 0 && settings[0].enabled_sites) {
      const enabledSites = settings[0].enabled_sites;
      
      // Check if "all" is enabled
      const toggleAll = document.getElementById('toggleAll');
      toggleAll.checked = enabledSites.includes('*');
      
      // Show custom sites
      enabledSites.filter(site => site !== '*').forEach(site => {
        addSiteToUI(site, true);
      });
    } else {
      // Default: all sites enabled
      document.getElementById('toggleAll').checked = true;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function handleToggleAll(e) {
  if (!accessToken || !currentUser) return;
  
  const enabled = e.target.checked;
  
  try {
    await updateUserSettings(enabled ? ['*'] : []);
    // Clear custom sites if disabling all
    if (!enabled) {
      document.getElementById('customSites').innerHTML = '';
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    e.target.checked = !enabled; // Revert on error
  }
}

async function handleAddSite() {
  const siteUrl = document.getElementById('siteUrl').value.trim();
  if (!siteUrl) return;
  
  // Normalize URL (remove protocol, www, trailing slash)
  const normalized = siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();
  
  if (!accessToken || !currentUser) return;
  
  try {
    // Get current settings
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${currentUser.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const settings = await response.json();
    let enabledSites = settings.length > 0 && settings[0].enabled_sites ? settings[0].enabled_sites : ['*'];
    
    // Remove '*' if adding specific sites
    if (enabledSites.includes('*')) {
      enabledSites = enabledSites.filter(s => s !== '*');
      document.getElementById('toggleAll').checked = false;
    }
    
    // Add new site if not already present
    if (!enabledSites.includes(normalized)) {
      enabledSites.push(normalized);
      await updateUserSettings(enabledSites);
      addSiteToUI(normalized, true);
    }
    
    document.getElementById('addSiteModal').style.display = 'none';
    document.getElementById('siteUrl').value = '';
  } catch (error) {
    console.error('Error adding site:', error);
    alert('Error adding site. Please try again.');
  }
}

function addSiteToUI(site, enabled) {
  const customSitesDiv = document.getElementById('customSites');
  const siteItem = document.createElement('div');
  siteItem.className = 'site-item';
  siteItem.innerHTML = `
    <div class="site-info">
      <span class="site-name">${site}</span>
      <span class="site-description">Extension active on this domain</span>
    </div>
    <div>
      <label class="toggle">
        <input type="checkbox" class="site-toggle" data-site="${site}" ${enabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <button class="btn btn-secondary" style="margin-left: 10px; width: auto; padding: 6px 12px; font-size: 13px;" data-remove="${site}">Remove</button>
    </div>
  `;
  
  customSitesDiv.appendChild(siteItem);
  
  // Add event listeners
  siteItem.querySelector('.site-toggle').addEventListener('change', async (e) => {
    await toggleSite(site, e.target.checked);
  });
  
  siteItem.querySelector(`[data-remove="${site}"]`).addEventListener('click', async () => {
    await removeSite(site);
    siteItem.remove();
  });
}

async function toggleSite(site, enabled) {
  if (!accessToken || !currentUser) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${currentUser.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const settings = await response.json();
    let enabledSites = settings.length > 0 && settings[0].enabled_sites ? [...settings[0].enabled_sites] : [];
    
    if (enabled) {
      if (!enabledSites.includes(site)) {
        enabledSites.push(site);
      }
    } else {
      enabledSites = enabledSites.filter(s => s !== site);
    }
    
    await updateUserSettings(enabledSites);
  } catch (error) {
    console.error('Error toggling site:', error);
  }
}

async function removeSite(site) {
  if (!accessToken || !currentUser) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${currentUser.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const settings = await response.json();
    let enabledSites = settings.length > 0 && settings[0].enabled_sites ? [...settings[0].enabled_sites] : [];
    enabledSites = enabledSites.filter(s => s !== site);
    
    await updateUserSettings(enabledSites);
  } catch (error) {
    console.error('Error removing site:', error);
  }
}

async function updateUserSettings(enabledSites) {
  if (!accessToken || !currentUser) return;
  
  // Check if settings exist
  const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${currentUser.id}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const existing = await checkResponse.json();
  
  const settingsData = {
    user_id: currentUser.id,
    enabled_sites: enabledSites,
    updated_at: new Date().toISOString()
  };
  
  if (existing.length > 0) {
    // Update existing
    await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${currentUser.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(settingsData)
    });
  } else {
    // Create new
    await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(settingsData)
    });
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

function extractDomain(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url;
  }
}

