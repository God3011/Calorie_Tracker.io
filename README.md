# Calorie Tracker

A simple app to log your weight and daily calories into a Google Sheet. One row per day. There's a web form for quick entries, and an AI agent (Gemini) you can chat with to log meals in plain English.

## What's in the repo

```
Calorie_Tracker.io/
├── index.html              # the web form
├── script.js               # frontend logic
├── styles.css              # styling
├── google-apps-script.js   # backend — runs in Google Apps Script
└── agent/                  # optional chat agent (Python + Streamlit)
    ├── app.py
    ├── agent.py
    ├── tools.py
    ├── requirements.txt
    └── .env.example
```

## How it works

You enter weight + calories → frontend POSTs to a Google Apps Script web app → the script writes/updates a row in your Google Sheet. If a row for today already exists, it merges instead of adding a duplicate.

The agent does the same thing but lets you say "5 eggs and toast for breakfast" and figures out the calories itself.

## Setup

### 1. Make the Google Sheet

1. Go to https://sheets.google.com and create a blank sheet
2. Copy the **Sheet ID** from the URL — the long string between `/d/` and `/edit`

### 2. Set up the Apps Script

1. Go to https://script.google.com → **New project**
2. Delete the default code, paste in everything from `google-apps-script.js`
3. Replace `SHEET_ID` at the top with your Sheet ID
4. Save (Cmd/Ctrl+S)
5. Run the `testSetup` function once — it'll ask for permissions, approve them

### 3. Deploy it as a web app

1. Click **Deploy → New deployment**
2. Pick **Web app** as the type
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy** and copy the URL (ends in `/exec`)

### 4. Connect the frontend

Open `script.js` and paste your `/exec` URL into `GOOGLE_SCRIPT_URL` at the top.

Run a local server (don't open `index.html` directly — CORS will block it):

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 and you're done.

### 5. (Optional) Run the chat agent

```bash
cd agent
cp .env.example .env
# fill in your keys in .env:
#   GOOGLE_SCRIPT_URL — same /exec url as above
#   GOOGLE_API_KEY    — get one at https://aistudio.google.com/apikey
pip install -r requirements.txt
streamlit run app.py
```

## Usage

**Web form:** fill in date, weight, calories per meal, hit submit. Table below shows your history.

**Agent:** chat naturally — *"had 2 eggs and toast for breakfast"*, *"weight 72kg today"*, *"how was my week?"* It'll show the breakdown, ask you to confirm, then log it.

## Sheet structure

The script creates these columns automatically:

| Date | Weight (kg) | Morning Calories | Lunch Calories | Dinner Calories | Total Calories |

One row per day — re-logging the same date updates the existing row.

## Gotchas

**Frontend says "HTTP 404"** → the Apps Script deployment isn't reachable. Open the `/exec` URL in incognito. If it doesn't show JSON, redeploy with access set to **Anyone**.

**Frontend works in some browsers, not others** → opening `index.html` via `file://` will fail CORS. Use a local server.

**Agent says quota exceeded** → free-tier Gemini gives you 20 requests/day per model. Either wait until UTC midnight, switch to a different model in `agent/agent.py`, or enable billing.

**Agent shows `'list' object has no attribute 'get'`** → this used to mask the real error from Gemini. Streaming is now disabled so you should see the actual message. If it returns, check the terminal where Streamlit is running.

**Don't commit `agent/.env`** → it's gitignored. Don't paste real keys into `.env.example` either — Google's secret scanner will revoke them.

## Customising

- New form field → update `index.html`, `script.js`, and the sheet columns in `google-apps-script.js`
- Styling → all in `styles.css`
- Switch Gemini model → edit `agent/agent.py`, the `model=` line
