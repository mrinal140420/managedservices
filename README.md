# Mentis DevOps Command Center - EC2 Deployment Guide

This guide provides instructions to deploy the Mentis React frontend and FastAPI backend on an Ubuntu EC2 server running Apache2. 

## Prerequisites
- **OS:** Ubuntu 22.04+ (or similar)
- **Domain:** `managedservice.adamastech.in` pointed to your EC2 Public IP via A Record.
- **Web Server:** Apache2 (`sudo apt install apache2`)
- **Python:** Python 3.10+
- **Node.js:** Node.js 18+ and npm
- **MantisBT:** Existing local installation on Apache2

---

## 1. Clone & Configure the Application

First, clone the repository to your server (e.g., `/var/www/mentis`).

### Backend Configuration
Navigate to the root directory and set up your backend environment variables:
```bash
cp .env.example .env
nano .env
```
Ensure you fill in:
- `MANTIS_API_URL` (typically `http://localhost/mantisbt/api/rest/`)
- `MANTIS_TOKEN` (Generate this from your administrator account inside MantisBT)
- `DB_PASS` (The root/admin password for MySQL)
- `SECRET_KEY` (Generate a random secure string)

### Frontend Configuration
Navigate to the frontend directory and set up the Vite environment variables:
```bash
cd frontend
cp .env.example .env
nano .env
```
Ensure `VITE_API_BASE_URL` is set to `http://managedservice.adamastech.in/api`

---

## 2. Install Dependencies & Build

### Backend setup
Install the Python dependencies globally or in a virtual environment:
```bash
# In the root folder
sudo apt install python3-pip python3-venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend setup
Build the React application:
```bash
cd frontend
npm install
npm run build
```
The compiled static files will now be located in `frontend/dist`.

---

## 3. Configure the FastAPI Background Service

We will use `systemd` to run the FastAPI server persistently in the background.

1. Create a service file:
```bash
sudo nano /etc/systemd/system/mentis-api.service
```

2. Add the following configuration (adjust `/var/www/mentis` if you cloned it elsewhere):
```ini
[Unit]
Description=Mentis FastAPI Service
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/mentis
Environment="PATH=/var/www/mentis/venv/bin"
ExecStart=/var/www/mentis/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start mentis-api
sudo systemctl enable mentis-api
```

---

## 4. Apache2 VirtualHost Configuration

To avoid CORS issues and serve everything on one domain, we will configure Apache to serve the React files at the root (`/`) and act as a reverse proxy to forward requests from `/api` to our FastAPI service on port 8000.

1. Enable necessary Apache proxy modules:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
```

2. Create the VirtualHost file:
```bash
sudo nano /etc/apache2/sites-available/mentis.conf
```

3. Add the following configuration:
```apache
<VirtualHost *:80>
    ServerName managedservice.adamastech.in

    # 1. Serve the React Frontend Build
    DocumentRoot /var/www/mentis/frontend/dist

    <Directory /var/www/mentis/frontend/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router fallback
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>

    # 2. Reverse Proxy for the FastAPI Backend
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:8000/api
    ProxyPassReverse /api http://127.0.0.1:8000/api

    ErrorLog ${APACHE_LOG_DIR}/mentis_error.log
    CustomLog ${APACHE_LOG_DIR}/mentis_access.log combined
</VirtualHost>
```

4. Enable the site and restart Apache:
```bash
sudo a2ensite mentis.conf
sudo systemctl restart apache2
```

## 5. First Login
Once the site is live at `http://managedservice.adamastech.in/`, log in using the default MantisBT `administrator` credentials. The app connects directly to the MySQL database, so it will instantly recognize the Mantis administrator account!
