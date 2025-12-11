# Portal Landing Page - Agent Guide

## Project Overview

This is a **static landing page** that serves as the entry point for DreamDo's utility portals. It redirects users (admins, designers, partners) to their respective management tools.

## Architecture Context

```
https://admin.dreamdo.es/
         │
         ▼
   ┌─────────────────────────────────────┐
   │      Portal Landing Page            │
   │      (THIS PROJECT)                 │
   │                                     │
   │   [Admins]  [Designers]  [Partners] │
   └─────────────────────────────────────┘
         │            │            │
         ▼            ▼            ▼
   /admin-panel/   (future)     (future)
   Admin Dashboard  Designer     Partner
   (Dash app)       Portal       Portal
```

## Related Projects

| Project | Location | Description |
|---------|----------|-------------|
| **Portal Landing** (this) | `c:\AWS\dreamdo\portal-landing\` | Static landing page |
| **Admin Dashboard** | `c:\AWS\dreamdo\admin-dashboard-frontend\` | Dash/Plotly admin panel |
| **Aggregator API** | `c:\AWS\dreamdo\aggregator\` | Django REST API backend |

## Tech Stack

- **HTML5** - Structure
- **CSS3** - Styling (no frameworks, pure CSS)
- **JavaScript** - Minimal interactions (hover effects, animations)
- **No build tools** - No npm, webpack, React, etc.

## Project Structure

```
portal-landing/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
├── js/
│   └── script.js           # Interactions (optional)
├── images/
│   ├── logo.svg            # DreamDo logo
│   ├── background.png      # Hero background image
│   └── icons/
│       ├── admin.svg       # Admin card icon
│       ├── designer.svg    # Designer card icon
│       └── partner.svg     # Partner card icon
├── AGENT_GUIDE.md          # This file
└── README.md               # Project readme
```

## Design Requirements

Reference mockup provided by user shows a warm, professional landing page with:

### Key Design Elements

1. **Header**
   - DreamDo logo (top-left)
   - Subtle, not overpowering

2. **Hero Section**
   - Title: "Welcome to the dreamdo Utility Portal" (italic style)
   - Background: Warm beige/cream gradient with decorative image

3. **Portal Cards (3 cards)**
   - **Admins** - Green header (#4A6741 approximate)
   - **Designers** - Orange/terracotta header (#C4704C approximate)
   - **Partners** - Dark brown header (#4A3F3F approximate)
   
   Each card contains:
   - Colored header with icon and title
   - White/cream body
   - H2 subtitle
   - Description text
   - Call-to-action button

4. **Color Palette**
   - Background: Warm beige (#F5EDE4 approximate)
   - Admin green: #4A6741
   - Designer orange: #C4704C
   - Partner brown: #4A3F3F
   - Text: Dark gray/black
   - Accent: Cream/white

5. **Typography**
   - Headings: Serif or elegant sans-serif, italic for "dreamdo"
   - Body: Clean sans-serif

## Portal Links

| Card | Current Link | Notes |
|------|--------------|-------|
| Admins | `/admin-panel/` | Links to Admin Dashboard (deployed) |
| Designers | `#` or `/designers/` | Future - not yet built |
| Partners | `#` or `/partners/` | Future - not yet built |

## Local Development

### Testing Locally

```powershell
cd c:\AWS\dreamdo\portal-landing
python -m http.server 8080
```

Then open: `http://localhost:8080`

### Hot Reload

For automatic reload on file changes, you can use:
```powershell
# Install live-server globally (requires Node.js)
npm install -g live-server
live-server
```

Or just refresh the browser manually after changes.

## Deployment

### Server Details

| Item | Value |
|------|-------|
| EC2 IP | 54.216.156.92 |
| Domain | admin.dreamdo.es |
| SSH Key | `~/.ssh/aggregator-key.pem` |
| Deploy Path | `/var/www/landing/` |
| Nginx Config | `/etc/nginx/sites-available/admin-dashboard` |

### Deploy Steps

1. **Copy files to server**
   ```powershell
   scp -i ~/.ssh/aggregator-key.pem -r * ubuntu@54.216.156.92:/var/www/landing/
   ```

2. **SSH to server and set permissions**
   ```bash
   ssh -i ~/.ssh/aggregator-key.pem ubuntu@54.216.156.92
   sudo chown -R ubuntu:ubuntu /var/www/landing
   ```

3. **Configure Nginx** (if not already done)
   
   Add to `/etc/nginx/sites-available/admin-dashboard`:
   ```nginx
   # Landing page at root
   location = / {
       root /var/www/landing;
       index index.html;
   }
   
   location ~ ^/(css|js|images)/ {
       root /var/www/landing;
       expires 30d;
   }
   ```

4. **Test and reload Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Quick Redeploy

```powershell
# From portal-landing folder
scp -i ~/.ssh/aggregator-key.pem -r * ubuntu@54.216.156.92:/var/www/landing/
```

## Existing Nginx Configuration

The server already has:
- HTTPS configured with Let's Encrypt
- `/admin-panel/` routing to Dash app on port 8002
- `/api/v1/` routing to Django API on port 8001

You only need to add the root `/` location for the landing page.

## Assets Needed

1. **Logo**: Copy from admin-dashboard or request from user
   - Location in admin-dashboard: `c:\AWS\dreamdo\admin-dashboard-frontend\assets\logo.svg`

2. **Background Image**: User should provide or use a placeholder
   - Should be a decorative image (vase with plants in mockup)

3. **Icons**: Create or source SVG icons for:
   - Settings/gear icon (Admins)
   - Pencil/brush icon (Designers)  
   - Handshake icon (Partners)

## Browser Support

Target modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

No IE11 support needed.

## Accessibility

- Use semantic HTML (`<header>`, `<main>`, `<nav>`, `<footer>`)
- Add `alt` attributes to images
- Ensure sufficient color contrast
- Make buttons keyboard-accessible
- Add `aria-labels` where needed

## Performance

- Optimize images (compress PNG/SVG)
- Minimize CSS (optional for production)
- Keep JS minimal
- Use system fonts or limit web fonts

## Future Considerations

1. **Designer Portal**: When built, update the Designers card link
2. **Partner Portal**: When built, update the Partners card link
3. **Authentication**: Could add login detection to show user-specific portals
4. **Internationalization**: May need Spanish/Catalan versions
