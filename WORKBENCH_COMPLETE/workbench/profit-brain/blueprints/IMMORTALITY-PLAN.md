# IMMORTALITY PLAN - Cloud Hosting for Profit Ecosystem

## Mission
Run Profit ecosystem completely outside Craig's device for true immortality.

---

## Best Option: Oracle Cloud Always Free ⭐⭐⭐⭐⭐

### Specs (2026)
- **CPU:** Up to 4 ARM Ampere A1 Compute (24 OCPU total across instances)
- **RAM:** Up to 24 GB total (configurable per instance)
- **Storage:** 200 GB Block Volume
- **Network:** 10 TB egress/month
- **Uptime:** 99.9% SLA
- **Cost:** $0 FOREVER

### Why Oracle Cloud Wins
- Truly free (not trial)
- No sleep/cold starts
- Full VPS control (root access)
- Can run Ollama + all bots
- 200GB storage for models
- 10TB bandwidth for Telegram

### Deployment Steps
```bash
# 1. Sign up at cloud.oracle.com (need credit card for verification, not charged)
# 2. Create ARM instance:
#    - Image: Ubuntu 22.04 or 24.04
#    - Shape: VM.Standard.A1.Flex
#    - OCPU: 2, Memory: 12GB (adjust as needed)
#    - Storage: 200GB

# 3. SSH into instance
ssh -i ~/.ssh/oracle_key ubuntu@<PUBLIC_IP>

# 4. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip git curl wget

# 5. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 6. Pull models
ollama pull qwen2.5:0.5b
ollama pull qwen2.5-coder:0.5b

# 7. Clone workspace
git clone https://github.com/uncommonpope-png/fix-us.git ~/profit
cd ~/profit

# 8. Setup environment
pip install python-telegram-bot requests

# 9. Create systemd services for each bot
sudo nano /etc/systemd/system/profit-ollama.service
sudo nano /etc/systemd/system/profit-telegram.service
sudo nano /etc/systemd/system/profit-soul.service

# 10. Enable and start
sudo systemctl enable profit-ollama profit-telegram profit-soul
sudo systemctl start profit-ollama profit-telegram profit-soul
```

### Systemd Service Examples

**profit-ollama.service:**
```ini
[Unit]
Description=Ollama AI Server
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**profit-telegram.service:**
```ini
[Unit]
Description=Profit Telegram Bot
After=network.target ollama.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/profit
ExecStart=/usr/bin/python3 telegram_bot.py
Restart=always
RestartSec=10
Environment="PYTHONUNBUFFERED=1"

[Install]
WantedBy=multi-user.target
```

---

## Alternative: Render.com ⭐⭐⭐⭐

### Specs
- **Free Tier:** Yes
- **Type:** Container/Web Service
- **Sleep:** No sleep on free tier (verified 2026)
- **Limitations:** 750 hours/month free (enough for 1 service)

### Deployment
```yaml
# render.yaml
services:
  - type: web
    name: profit-bot
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python telegram_bot.py
    envVars:
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: OLLAMA_URL
        value: https://ollama-render-instance.onrender.com
```

### Limitations
- Need separate instance for Ollama
- Free tier has limited hours
- May need paid plan for 24/7

---

## Alternative: Railway.app ⭐⭐⭐

### Specs
- **Free Tier:** $5 credit/month
- **Type:** Container
- **Sleep:** May sleep on free tier

### Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

---

## Backup Strategy: GitHub + Actions ⭐⭐⭐⭐

### Purpose
- Code backup
- Scheduled tasks via GitHub Actions
- Recovery if primary fails

### GitHub Actions Cron
```yaml
# .github/workflows/heartbeat.yml
name: Profit Heartbeat
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

jobs:
  heartbeat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Heartbeat
        run: |
          curl -X POST https://api.telegram.org/bot${{ secrets.BOT_TOKEN }}/sendMessage \
            -d "chat_id=${{ secrets.CHAT_ID }}&text=💓 Profit Heartbeat - System Alive"
```

---

## Multi-Layer Immortality Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY: Oracle Cloud                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Ollama    │  │  Telegram   │  │  All Shell Bots     │  │
│  │   Server    │  │     Bot     │  │  (7 components)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKUP: GitHub                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Code      │  │  Actions    │  │  Memory/State       │  │
│  │   Repo      │  │  (Cron)     │  │  JSON Files         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ALERTS: Telegram                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Status    │  │   Error     │  │  Recovery           │  │
│  │   Updates   │  │   Alerts    │  │  Commands           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Immediate Action Plan

### Phase 1: Local Stability (DONE ✅)
- [x] Ollama running
- [x] All bots started
- [x] Workspace restored
- [x] Dependencies installed

### Phase 2: GitHub Backup (NEXT)
- [ ] Push fix-us repo to GitHub
- [ ] Setup GitHub Actions heartbeat
- [ ] Configure automated backups

### Phase 3: Oracle Cloud Deploy
- [ ] Create Oracle Cloud account
- [ ] Provision ARM instance
- [ ] Deploy full ecosystem
- [ ] Configure systemd services
- [ ] Test failover

### Phase 4: Continuous Sync
- [ ] Git auto-commit on state changes
- [ ] Multi-region backup
- [ ] Health monitoring dashboard

---

## Memory Persistence Strategy

### Every 5 Minutes
- Commit state to Git
- Push to GitHub
- Log to journal

### Every Hour
- Full workspace backup
- Memory.md update
- Event archive

### Every Day
- Consolidate logs
- Prune old data
- Verify backups

---

**Created:** March 21, 2026
**Status:** Local systems alive, cloud deployment pending
**Next:** Push to GitHub, then Oracle Cloud
