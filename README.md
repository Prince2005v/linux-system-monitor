# Linux System Monitor 🖥️
<img width="1452" height="830" alt="Screenshot 2026-04-15 at 11 27 16 AM" src="https://github.com/user-attachments/assets/a3ed5d44-76d7-4f56-a334-76f1d71fa286" />



A Python-based Linux system monitoring tool that tracks CPU, memory, and disk usage along with top CPU-consuming processes in real time. Designed to demonstrate strong system-level understanding, debugging skills, and Linux proficiency.
<img width="1468" height="870" alt="Screenshot 2026-02-07 at 8 19 32 PM" src="https://github.com/user-attachments/assets/d033a69f-3c3f-4fe1-8e5a-1cc883c00118" />
## 🔧 Features
- Real-time CPU, Memory, and Disk usage monitoring
- Displays top 5 CPU-consuming processes
- Configurable monitoring interval
- CPU usage alert threshold
- Supports CSV and JSON logging
- Clean CLI interface with flags

## 🛠️ Tech Stack
- Python 3
- psutil
- Linux / macOS
- Shell / CLI

## 📌 Usage

Activate virtual environment:
```bash
source venv/bin/activate
pip install -r requirements.txt
python monitor.py // run
```
## 🖥️ Next.js UI

A dashboard has been added with a proper Next.js interface that reads `system_logs.json`.

Install UI dependencies and run the frontend:
```bash
npm install
npm run dev
```

Open the dashboard at `http://localhost:3000`.

The Python monitor and the Next.js UI run separately: start the monitor first, then open the dashboard.
## 🚀 Deployment Options

### 1. Docker Container
Run the monitor in an isolated Docker container.
```bash
# Build the image
docker build -t linux-system-monitor .

# Run the container (needs privileged access to read host metrics)
docker run -d --name system-monitor --pid=host --privileged linux-system-monitor
```

### 2. Standalone Binary (PyInstaller)
Compile the script into a single executable that doesn't require Python to be installed.
```bash
# Install PyInstaller
pip install pyinstaller

# Build the executable
pyinstaller --onefile monitor.py

# Run the generated binary
./dist/monitor
```

### 3. Background Service (Systemd on Linux)
Run the monitor continuously as a background service.
```bash
# 1. Copy the script to a stable location
sudo mkdir -p /opt/linux-system-monitor
sudo cp monitor.py /opt/linux-system-monitor/

# 2. Copy the service file to systemd
sudo cp monitor.service /etc/systemd/system/

# 3. Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable monitor --now

# 4. Check status
sudo systemctl status monitor
```
