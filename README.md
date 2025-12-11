# DreamDo Portal Landing Page

A static landing page for DreamDo's utility portals, providing access to admin, designer, and partner tools.

## Quick Start

```powershell
cd c:\AWS\dreamdo\portal-landing
python -m http.server 8080
```

Open `http://localhost:8080` in your browser.

## Project Structure

```
portal-landing/
├── index.html          # Main page
├── css/
│   └── styles.css      # Styling
├── js/
│   └── script.js       # Interactions
├── images/
│   ├── logo.svg
│   ├── background.png
│   └── icons/
└── AGENT_GUIDE.md      # Detailed documentation
```

## Deploy

```powershell
scp -i ~/.ssh/aggregator-key.pem -r * ubuntu@54.216.156.92:/var/www/landing/
```

Live at: https://admin.dreamdo.es/

## Links

- **Admin Panel**: `/admin-panel/`
- **Designers**: Coming soon
- **Partners**: Coming soon
