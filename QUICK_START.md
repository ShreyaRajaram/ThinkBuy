# Quick Start Guide

## What I've Set Up For You

✅ **Extension Files Updated:**
- `manifest.json` - Added Supabase API permissions
- `popup.html` - Added login/signup UI with stats display
- `popup.js` - Added authentication and stats loading
- `content.js` - Added purchase tracking functionality
- `supabase-config.js` - Supabase API helper functions

## Next Steps (5 minutes)

### 1. Create Supabase Account
- Go to https://supabase.com and sign up (free)

### 2. Create Project
- Click "New Project"
- Name it "thinkbuy"
- Choose a database password (save it!)
- Wait 2-3 minutes for setup

### 3. Get API Keys
- Go to Settings → API
- Copy **Project URL** and **anon/public key**

### 4. Update Config
- Open `supabase-config.js`
- Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual values

### 5. Create Database Table
- Go to Table Editor → New Table
- Name: `purchase_attempts`
- Add columns (see SUPABASE_SETUP.md for details)

### 6. Test It!
- Reload extension in Chrome
- Click extension icon → Sign up
- Visit a shopping site → Click "Buy Now"
- Check Supabase table to see your data!

## Full Setup Instructions

See `SUPABASE_SETUP.md` for detailed step-by-step instructions including:
- Database table setup
- Row Level Security (RLS) policies
- Troubleshooting tips

## How It Works

1. **User signs up/logs in** → Credentials stored in Chrome storage
2. **User clicks "Buy Now"** → Modal appears
3. **Extension tracks the attempt** → Saves to Supabase:
   - Product name
   - Price (if found)
   - Website URL
   - Timestamp
4. **Stats update** → Popup shows total saved and attempts prevented

## Next Features to Build

- Web dashboard to view detailed stats
- Monthly progress reports
- Charts and graphs
- Export data to CSV/PDF

