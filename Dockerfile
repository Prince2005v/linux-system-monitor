FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the script
COPY monitor.py .

# Run the monitor
ENTRYPOINT ["python", "monitor.py"]
