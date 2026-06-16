import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, status, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import smtplib
from email.message import EmailMessage
import secrets
import string
import bcrypt
import jwt
from datetime import datetime, timedelta
import base64
from typing import Optional, List
from fastapi.responses import StreamingResponse
import csv
import io

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MANTIS_API_URL = os.getenv("MANTIS_API_URL", "http://localhost/mantisbt/api/rest/")
MANTIS_TOKEN = os.getenv("MANTIS_TOKEN", "OnI3c6tY3axWQ4t8fYn9YNCl7mASaB5h")

HEADERS = {
    "Authorization": MANTIS_TOKEN,
    "Content-Type": "application/json"
}

# ---------------------------------------------------------
# SECURITY: JWT & Password Hashing Configuration
# ---------------------------------------------------------
SECRET_KEY = "your-super-secret-jwt-key" # In production, use env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 hours

def hash_password(password: str):
    """Ensure secure password hashing before any database storage."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ---------------------------------------------------------
# EMAIL ENGINE: Python SMTP Sender
# ---------------------------------------------------------
def send_custom_email(to_email: str, subject: str, body: str, cc_emails: List[str] = None):
    """Sends custom, branded HTML emails directly from FastAPI."""
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email
    if cc_emails:
        msg['Cc'] = ', '.join(cc_emails)

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")

# ---------------------------------------------------------
# AUTHENTICATION
# ---------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(request: LoginRequest):
    """
    Login endpoint. Ideally, this authenticates against MantisBT or a local DB.
    For this demo, we mock the MantisBT login check and return a JWT.
    """
    # We connect directly to the Mantis MySQL database to verify credentials.
    # This allows us to use both existing Mantis users (MD5) and newly provisioned users (bcrypt).
    import pymysql
    import hashlib
    
    clean_username = request.username.strip().lower()
    
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices'),
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # Query the exact user
            sql = "SELECT id, username, password, access_level, realname FROM mantis_user_table WHERE username = %s"
            cursor.execute(sql, (clean_username,))
            user = cursor.fetchone()
            
        connection.close()
        
        if not user:
            raise HTTPException(status_code=401, detail=f"User '{clean_username}' not found in MantisBT.")
            
        # Verify Password
        is_valid = False
        is_temp_password = False
        db_password = user['password']
        
        # 1. Check if it's a standard MantisBT MD5 hash (existing users)
        md5_hash = hashlib.md5(request.password.encode()).hexdigest()
        
        if md5_hash == db_password:
            is_valid = True
            # If they have the default empty hash, treat it as needing reset
            if db_password == "d41d8cd98f00b204e9800998ecf8427e":
                is_temp_password = True
                
        # 2. If not MD5, check if it's a bcrypt hash (users provisioned by our FastAPI backend)
        # Only verify if it has the standard bcrypt prefix to avoid passlib crashing on long inputs
        elif db_password.startswith("$2b$") or db_password.startswith("$2a$"):
            try:
                if bcrypt.checkpw(request.password.encode('utf-8'), db_password.encode('utf-8')):
                    is_valid = True
                    is_temp_password = True
            except ValueError:
                pass
                    
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid password.")
            
        # Standardize data for the token
        user_data = {
            "id": user['id'],
            "access_level": int(user['access_level']),
            "real_name": user['realname'] or clean_username,
            "is_temp_password": is_temp_password
        }
            
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": request.username, "access_level": user["access_level"], "id": user["id"]},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }

# ---------------------------------------------------------
# TICKETS (Including Headless File Uploads & Dynamic CC)
# ---------------------------------------------------------
@app.get("/api/tickets")
def get_tickets():
    try:
        response = requests.get(f"{MANTIS_API_URL}issues/", headers=HEADERS)
        if response.status_code == 200:
            raw_data = response.json()
            cleaned_tickets = []
            for issue in raw_data.get('issues', []):
                cleaned_tickets.append({
                    "id": issue.get('id'),
                    "summary": issue.get('summary'),
                    "status": issue.get('status', {}).get('name'),
                    "client": issue.get('project', {}).get('name'),
                    "project_id": issue.get('project', {}).get('id'),
                    "assigned_to": issue.get('handler', {}).get('real_name', 'Unassigned'),
                    "handler_id": issue.get('handler', {}).get('id'),
                    "reporter_id": issue.get('reporter', {}).get('id'),
                    "category": issue.get('category', {}).get('name')
                })
            return {"tickets": cleaned_tickets}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch from MantisBT")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/tickets/csv")
def download_tickets_csv():
    """Generates a CSV report of all tickets dynamically."""
    try:
        response = requests.get(f"{MANTIS_API_URL}issues/", headers=HEADERS)
        if response.status_code == 200:
            raw_data = response.json()
            issues = raw_data.get('issues', [])
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write Header
            writer.writerow(["Ticket ID", "Project/Tier", "Category", "Summary", "Status", "Priority", "Severity", "Reporter", "Assigned Developer", "Date Submitted", "Last Updated"])
            
            for issue in issues:
                writer.writerow([
                    issue.get('id', ''),
                    issue.get('project', {}).get('name', ''),
                    issue.get('category', {}).get('name', ''),
                    issue.get('summary', ''),
                    issue.get('status', {}).get('name', ''),
                    issue.get('priority', {}).get('name', ''),
                    issue.get('severity', {}).get('name', ''),
                    issue.get('reporter', {}).get('name', ''),
                    issue.get('handler', {}).get('real_name', 'Unassigned'),
                    issue.get('created_at', ''),
                    issue.get('updated_at', '')
                ])
                
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=Mentis_Global_Ticket_Report.csv"}
            )
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch from MantisBT")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tickets")
async def create_ticket(
    summary: str = Form(...),
    description: str = Form(...),
    client: str = Form(...),
    category: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    Creates a ticket, processes attachments (Base64), and sends a dynamic CC notification.
    """
    mantis_payload = {
        "summary": summary,
        "description": description,
        "project": {"name": client},
        "category": {"name": category}
    }
    
    # 1. Process Headless File Upload if present
    if file:
        # Validate MIME type to prevent malicious scripts
        allowed_mimes = ["image/jpeg", "image/png", "text/plain", "application/pdf"]
        if file.content_type not in allowed_mimes:
            raise HTTPException(status_code=400, detail="Invalid file type. Only images, text, and PDF are allowed.")
        
        content = await file.read()
        encoded_content = base64.b64encode(content).decode('utf-8')
        mantis_payload["files"] = [
            {
                "name": file.filename,
                "content": encoded_content
            }
        ]

    try:
        response = requests.post(f"{MANTIS_API_URL}issues/", headers=HEADERS, json=mantis_payload)
        
        if response.status_code == 201:
            issue_data = response.json()
            issue_id = issue_data['issue']['id']
            
            # 2. Dynamic Email CCs
            # Mock lookup: find the manager associated with this project. 
            # In production, query your local DB or Mantis API.
            project_manager_email = "manager@company.com" 
            admin_email = "admin@company.com"
            
            email_body = f"""
            New Ticket Submitted: #{issue_id} - {summary}
            Project: {client}
            
            Description:
            {description}
            
            Please log in to the command center to view.
            """
            
            # Send notification to support queue, CCing the specific manager and admin
            send_custom_email(
                to_email="support@company.com", 
                subject=f"New Ticket: {summary}", 
                body=email_body,
                cc_emails=[project_manager_email, admin_email]
            )
            
            return {"message": "Ticket created successfully", "id": issue_id}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TicketStatusUpdate(BaseModel):
    status_name: Optional[str] = None
    handler_name: Optional[str] = None
    time_logged_hours: Optional[float] = None
    bugnote_text: Optional[str] = None

@app.put("/api/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, data: TicketStatusUpdate):
    """
    Updates the status or handler of a ticket in MantisBT. 
    If resolving, requires time_logged_hours to be added as a bugnote.
    """
    mantis_payload = {}
    if data.status_name:
        mantis_payload["status"] = {"name": data.status_name}
    if data.handler_name:
        mantis_payload["handler"] = {"name": data.handler_name}
    
    try:
        response = requests.patch(f"{MANTIS_API_URL}issues/{ticket_id}", headers=HEADERS, json=mantis_payload)
        
        if response.status_code not in [200, 204]:
            raise HTTPException(status_code=response.status_code, detail=f"Failed to update status: {response.text}")
            
        # 2. Add time log / bugnote if provided
        if data.bugnote_text or data.time_logged_hours:
            note_text = data.bugnote_text or ""
            if data.time_logged_hours:
                note_text = f"Time Logged: {data.time_logged_hours} hours.\n{note_text}"
                
            note_payload = {
                "text": note_text,
                "view_state": {"id": 10} # public
            }
            # Note: Mantis API supports time tracking in bugnotes but requires specific config.
            # Using text notes as a reliable fallback for headless logging.
            
            requests.post(f"{MANTIS_API_URL}issues/{ticket_id}/notes", headers=HEADERS, json=note_payload)
            
        return {"message": "Status updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# NEW ROUTE: Create User & Send Temp Password
# ---------------------------------------------------------
class UserCreate(BaseModel):
    username: str
    email: str
    real_name: str
    access_level: int

@app.post("/api/users")
def create_user(user: UserCreate):
    """Creates a user, hashes their password, and sends a welcome email."""
    # 1. Generate a secure 12-character temporary password
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    temp_password = ''.join(secrets.choice(alphabet) for i in range(12))

    # 2. Hash the password for secure local storage/verification
    secure_hash = hash_password(temp_password)
    # (Optional: Save `user.username` and `secure_hash` to your own local React-auth DB here)

    # 3. Send to MantisBT API
    mantis_payload = {
        "username": user.username,
        "password": temp_password, # MantisBT requires plain text to do its own internal hashing
        "real_name": user.real_name,
        "email": user.email,
        "access_level": {"id": user.access_level}
    }
    
    response = requests.post(f"{MANTIS_API_URL}users/", headers=HEADERS, json=mantis_payload)
    
    if response.status_code in [200, 201]:
        # Force the password in the database to be our bcrypt hash so our /api/login logic works
        import pymysql
        try:
            connection = pymysql.connect(
                host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices')
            )
            with connection.cursor() as cursor:
                cursor.execute("UPDATE mantis_user_table SET password=%s WHERE username=%s", (secure_hash, user.username))
            connection.commit()
            connection.close()
        except Exception as e:
            print("Failed to force update password:", e)
            
        # 4. Trigger the custom onboarding email
        email_body = f"""
        Welcome to the DevOps Command Center!
        
        Your account has been successfully provisioned.
        Username: {user.username}
        Temporary Password: {temp_password}
        
        Please log in at http://localhost:5173/login and update your password immediately.
        """
        send_custom_email(user.email, "Welcome to DevOps Command Center - Your Credentials", email_body)
        
        return {"message": "User created and welcome email sent."}
    else:
        raise HTTPException(status_code=response.status_code, detail=response.text)

# ---------------------------------------------------------
# NEW ROUTE: Project Assignment & Notification
# ---------------------------------------------------------
class ProjectAssignment(BaseModel):
    manager_email: str
    manager_name: str
    project_name: str
    project_id: int
    user_id: int
    access_level: int # e.g., 70 for Manager

@app.post("/api/admin/assign-project")
def assign_project_to_manager(data: ProjectAssignment):
    """Links a user to a project in MantisBT and emails them."""
    
    mantis_payload = {
        "user": {"id": data.user_id},
        "access_level": {"id": data.access_level}
    }
    
    # 1. API Call to MantisBT to link user to the project
    response = requests.post(f"{MANTIS_API_URL}projects/{data.project_id}/users/", headers=HEADERS, json=mantis_payload)
    
    if response.status_code in [200, 201, 204]:
        # 2. Trigger the notification email (Solving Scenario 3)
        email_body = f"""
        Hello {data.manager_name},
        
        You have been formally designated as the Project Manager for: {data.project_name}. 
        
        You now have the authority to allocate resources, manage developers, and oversee the triage queue for this infrastructure tier.
        
        View your new dashboard here: http://localhost:5173/
        """
        send_custom_email(data.manager_email, f"[DevOps Center] Assigned to Project: {data.project_name}", email_body)
        
        return {"status": "success", "message": f"Project assigned and {data.manager_name} notified."}
    else:
        raise HTTPException(status_code=response.status_code, detail=response.text)

@app.get("/api/admin/data")
def get_admin_dropdown_data():
    """Fetches real users and projects from the local MantisBT MySQL DB for the Admin dropdowns."""
    import pymysql
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices'),
            cursorclass=pymysql.cursors.DictCursor
        )
        
        users = []
        projects = []
        
        with connection.cursor() as cursor:
            # Fetch Users
            cursor.execute("SELECT id, username, realname, access_level, email, enabled FROM mantis_user_table ORDER BY access_level DESC")
            user_results = cursor.fetchall()
            for u in user_results:
                users.append({
                    "id": u["id"],
                    "username": u["username"],
                    "real_name": u["realname"] or u["username"],
                    "access_level": int(u["access_level"]),
                    "email": u["email"],
                    "enabled": bool(u["enabled"])
                })
                
            # Fetch Projects
            cursor.execute("SELECT id, name FROM mantis_project_table ORDER BY name ASC")
            project_results = cursor.fetchall()
            for p in project_results:
                projects.append({
                    "id": p["id"],
                    "name": p["name"]
                })
                
        connection.close()
        return {"users": users, "projects": projects}
        
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

@app.get("/api/users/{user_id}/projects")
def get_user_assigned_projects(user_id: int):
    """Fetches only the projects explicitly assigned to a given user in MantisBT."""
    import pymysql
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices'),
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute('''
                SELECT p.id, p.name 
                FROM mantis_project_table p
                JOIN mantis_project_user_list_table u ON p.id = u.project_id
                WHERE u.user_id = %s
            ''', (user_id,))
            assigned_projects = cursor.fetchall()
            return {"projects": assigned_projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# NEW ROUTES: Dynamic Categories
# ---------------------------------------------------------
@app.get("/api/users/{user_id}/categories")
def get_user_custom_categories(user_id: int):
    """Fetches custom project-specific categories assigned to the user's projects."""
    import pymysql
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices'),
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute('''
                SELECT DISTINCT c.name 
                FROM mantis_category_table c
                JOIN mantis_project_user_list_table u ON c.project_id = u.project_id
                WHERE u.user_id = %s AND c.project_id != 0
            ''', (user_id,))
            custom_categories = [row['name'] for row in cursor.fetchall()]
            return {"categories": custom_categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CategoryCreate(BaseModel):
    name: str

@app.post("/api/projects/{project_id}/categories")
def create_project_category(project_id: int, category: CategoryCreate):
    """Creates a project-specific category in MantisBT."""
    import pymysql
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices')
        )
        with connection.cursor() as cursor:
            cursor.execute('''
                INSERT INTO mantis_category_table (project_id, user_id, name, status) 
                VALUES (%s, 0, %s, 0)
            ''', (project_id, category.name))
        connection.commit()
        connection.close()
        return {"status": "success", "message": f"Category '{category.name}' created for project {project_id}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# NEW ROUTES: User Management Lifecycle
# ---------------------------------------------------------
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    """Hard deletes a user from MantisBT."""
    response = requests.delete(f"{MANTIS_API_URL}users/{user_id}", headers=HEADERS)
    if response.status_code in [200, 204]:
        return {"status": "success", "message": "User permanently deleted."}
    else:
        raise HTTPException(status_code=response.status_code, detail=f"Failed to delete user: {response.text}")

@app.put("/api/users/{user_id}/status")
def toggle_user_status(user_id: int, enabled: bool):
    """Disables or enables a user by updating the MySQL database directly."""
    import pymysql
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices')
        )
        with connection.cursor() as cursor:
            cursor.execute("UPDATE mantis_user_table SET enabled=%s WHERE id=%s", (1 if enabled else 0, user_id))
        connection.commit()
        connection.close()
        return {"status": "success", "message": f"User {'enabled' if enabled else 'disabled'} successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/{user_id}/reset")
def reset_user_password(user_id: int):
    """Generates a new temporary password, hashes it, saves it to DB, and emails the user."""
    import pymysql
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', 'root'),
            database=os.getenv('DB_NAME', 'managedservices'),
            cursorclass=pymysql.cursors.DictCursor
        )
        
        # 1. Get User Email
        with connection.cursor() as cursor:
            cursor.execute("SELECT username, email FROM mantis_user_table WHERE id=%s", (user_id,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
            # 2. Generate new temp pass
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
            secure_hash = hash_password(temp_password)
            
            # 3. Update DB with bcrypt hash
            cursor.execute("UPDATE mantis_user_table SET password=%s WHERE id=%s", (secure_hash, user_id))
            
        connection.commit()
        connection.close()
        
        # 4. Email the new credentials
        email_body = f"""
        Hello {user['username']},
        
        Your password has been administratively reset.
        New Temporary Password: {temp_password}
        
        Please log in at http://localhost:5173/login and set a permanent password.
        """
        send_custom_email(user['email'], "DevOps Command Center - Password Reset", email_body)
        
        return {"status": "success", "message": "Password reset successfully and email sent."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))