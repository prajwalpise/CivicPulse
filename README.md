# CivicLens – Community Hero

**AI-powered hyperlocal civic issue reporting platform**

## About

CivicLens is a web app that lets citizens photograph community problems (potholes, water leaks, broken streetlights, garbage) and report them instantly. The app uses Google Gemini AI to auto-analyze photos, detect duplicates, and generate community insights.

**Built for Vibe2Ship Hackathon | Problem Statement 2**

## Features

- 📷 **Photo Upload** – Upload issue photo, Gemini Vision auto-analyzes it
- 🤖 **AI Pipeline** – Auto-categorize, detect duplicates, assign severity, flag priority
- 👥 **Community Verification** – 3 upvotes = Community Verified status
- 📊 **Dashboard** – Charts showing issues by category, status, severity
- 🔥 **AI Insights** – Hotspot prediction, weekly summary, neglected categories
- 🎮 **Gamification** – XP points, badges, leaderboard
- 🌙 **Dark Mode** – Light/dark theme toggle
- 📱 **Mobile Responsive** – Works on phone, tablet, desktop

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript (no frameworks)
- Google Gemini 2.0 Flash API (image + text generation)
- Chart.js (data visualization)
- localStorage (data persistence)
- Google AI Studio (deployment)

## How to Use

1. Go to the deployed app link below
2. Enter your name
3. Click "Report Issue" tab
4. Upload a photo of the problem
5. Click "Analyze with AI" 
6. AI fills in category, severity, title automatically
7. Click "Submit Issue"
8. Browse Feed to upvote other issues
9. Check Dashboard for impact stats
10. View AI Insights for community trends

## Deploy Your Own

### Option 1: Google AI Studio (easiest)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "New prompt"
3. Paste the master prompt (see DEPLOYMENT.md)
4. Click Run
5. Click Deploy → Deploy as web app
6. Share the public link

### Option 2: Self-Host
1. Download `index.html` from this repo
2. Open in any web server or upload to GitHub Pages
3. Add your Gemini API key in the app's yellow banner

## Gemini API Key

To enable AI features:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Paste it in the yellow "Set your Gemini API key" banner at the top of the app
3. Click Save

## Features in Detail

### Agentic Pipeline
When you submit an issue, 5 steps run automatically:
1. Gemini Vision analyzes the photo
2. App checks for duplicate reports (same area + category within 48h)
3. If duplicate found → merge upvotes instead of creating new issue
4. Auto-assign urgency score (1-5)
5. If Critical severity → flag for priority

### Gamification
- **+10 XP** for reporting an issue
- **+5 XP** for upvoting
- **+20 XP** for resolving an issue
- **5 Badges**: First Reporter, Verified Hero, Community Guardian, Power Reporter, Active Citizen
- **Leaderboard**: Top citizens by XP

### Community Verification
- Issues start as "Reported"
- When 3+ people upvote → auto-changes to "Verified"
- Signals to authorities that real people care about this problem

## Data

All data is stored locally in your browser (localStorage). No backend server. No logins required. Data persists until you clear browser cache.

Demo data is pre-loaded so you can see the app in action immediately.

## Limitations

- Single-user per browser (data stored locally)
- No real integration with city authorities (yet)
- Gemini API calls use free tier (rate limited)
- Images stored as base64 in localStorage (max ~5MB per image)

## Future Improvements

- Real-time map view with Google Maps API
- Push notifications for issue updates
- Official channel for municipal staff to log in
- Email notifications
- Image storage on cloud (Firebase)
- Multi-user sync
- Mobile app (React Native)

## Files

- `index.html` – Complete app (HTML + CSS + JS in one file)
- `README.md` – This file
- `DEPLOYMENT.md` – Step-by-step deployment guide

## Author

Built by [Your Name] for Vibe2Ship Hackathon 2026

## License

MIT License – feel free to fork and modify

## Links

- **Live App**: [paste your AI Studio link]
- **Project Doc**: [paste your Google Doc link]

---

Made with ❤️ for better cities.