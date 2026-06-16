import re

with open('main.py', 'r') as f:
    content = f.read()

# Add dotenv imports at the top
if "load_dotenv" not in content:
    content = content.replace("from fastapi import FastAPI", "import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\nfrom fastapi import FastAPI")

# Replace hardcoded configs
content = content.replace('MANTIS_API_URL = "http://localhost/mantisbt/api/rest/"', 'MANTIS_API_URL = os.getenv("MANTIS_API_URL", "http://localhost/mantisbt/api/rest/")')
content = content.replace('MANTIS_TOKEN = "OnI3c6tY3axWQ4t8fYn9YNCl7mASaB5h"', 'MANTIS_TOKEN = os.getenv("MANTIS_TOKEN", "OnI3c6tY3axWQ4t8fYn9YNCl7mASaB5h")')
content = content.replace('SECRET_KEY = "supersecretkey"', 'SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")')

# Replace Database connections
pattern = r"host='localhost',\s*user='root',\s*password='root',\s*database='managedservices'"
replacement = "host=os.getenv('DB_HOST', 'localhost'),\n            user=os.getenv('DB_USER', 'root'),\n            password=os.getenv('DB_PASS', 'root'),\n            database=os.getenv('DB_NAME', 'managedservices')"

content = re.sub(pattern, replacement, content)

# Update CORS
cors_pattern = r'allow_origins=\["http://localhost:5173"\],'
cors_replacement = 'allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://managedservice.adamastech.in").split(","),'
content = re.sub(cors_pattern, cors_replacement, content)

with open('main.py', 'w') as f:
    f.write(content)
print("main.py refactored successfully.")
