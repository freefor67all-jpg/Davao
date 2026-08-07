# De Venom

An AI chat app.

## Deploy on Render

1. Push this folder to a new GitHub repo.
2. On Render: **New +** → **Web Service** → connect your GitHub repo.
3. Settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Under **Environment**, add a variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get one at console.anthropic.com — billing required)
5. Deploy. Render gives you a URL like `de-venom.onrender.com`.
6. Open that URL on your iPhone (Safari → Share → Add to Home Screen) or Android (Chrome → menu → Install app).

Note: Render's free tier spins down after inactivity, so the first message after a while may be slow to respond while it wakes up.
