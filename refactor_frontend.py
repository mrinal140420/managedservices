import os
import re

directory = r"d:\MRINAL\ATC\Mentis\frontend\src\components"

for filename in os.listdir(directory):
    if filename.endswith(".jsx"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        content = re.sub(r"'http://localhost:8000/api([^']*)'", r"`${import.meta.env.VITE_API_BASE_URL}\1`", content)
        content = re.sub(r"`http://localhost:8000/api([^`]*)`", r"`${import.meta.env.VITE_API_BASE_URL}\1`", content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Frontend refactored successfully.")
