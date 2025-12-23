# ThinkBuy Web App

A web dashboard for the ThinkBuy Chrome extension that allows users to:
- View their savings statistics
- See recent purchase attempts prevented
- Manage which websites the extension is active on

## Setup

### 1. Database Setup

First, create the `user_settings` table in Supabase. See `DATABASE_SETUP.md` for detailed instructions.

### 2. Configuration

Make sure `supabase-config.js` has your Supabase credentials (it should already be configured from the extension setup).

### 3. Run the Web App

#### Option A: Local Development

Simply open `index.html` in your browser. Since it uses Supabase, it will work locally without a server.

#### Option B: Deploy (Recommended)

Deploy to any static hosting service:

**Vercel:**
```bash
npm install -g vercel
cd web-app
vercel
```

**Netlify:**
- Drag and drop the `web-app` folder to [Netlify Drop](https://app.netlify.com/drop)

**GitHub Pages:**
- Push to GitHub
- Go to Settings → Pages
- Select the `web-app` folder as the source

## Features

### Dashboard
- **Total Saved**: Cumulative amount saved from prevented purchases
- **Purchase Attempts Prevented**: Total count of times the modal appeared
- **Saved This Month**: Monthly savings breakdown
- **Average Per Attempt**: Average amount saved per purchase attempt
- **Recent Activity**: List of recent purchase attempts with product names and amounts

### Settings
- **Toggle Extension**: Enable/disable extension on all websites
- **Manage Sites**: Add/remove specific websites where the extension should be active
- Settings sync automatically with the Chrome extension

## How It Works

1. User signs up/logs in (uses same Supabase auth as extension)
2. Extension tracks purchase attempts and saves to `purchase_attempts` table
3. Web app reads from same database to display stats
4. User settings are stored in `user_settings` table
5. Extension checks settings before showing the modal

## File Structure

```
web-app/
├── index.html          # Main HTML (login + dashboard + settings)
├── styles.css          # All styles
├── app.js              # Application logic
├── supabase-config.js  # Supabase configuration (shared with extension)
├── DATABASE_SETUP.md   # Database setup instructions
└── README.md           # This file
```

## Notes

- The web app shares the same Supabase project and authentication as the extension
- Users must log in with the same credentials they use in the extension
- Settings sync in real-time - changes in web app affect extension behavior immediately
- The extension checks settings on each page load, so changes take effect after a page refresh

