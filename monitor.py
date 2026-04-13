import psutil
import time
import argparse
import csv
import json
from datetime import datetime

# ---------------- CLI ARGUMENTS ----------------
parser = argparse.ArgumentParser(description="Linux System Monitor")
parser.add_argument("--interval", type=int, default=5, help="Monitoring interval in seconds")
parser.add_argument("--threshold", type=int, default=80, help="CPU alert threshold")
parser.add_argument("--log-format", choices=["txt", "csv", "json"], default="txt",
                    help="Log format: txt / csv / json")
args = parser.parse_args()

INTERVAL = args.interval
CPU_ALERT_THRESHOLD = args.threshold
LOG_FORMAT = args.log_format

LOG_FILE_TXT = "system_logs.txt"
LOG_FILE_CSV = "system_logs.csv"
LOG_FILE_JSON = "system_logs.json"


# ---------------- SYSTEM FUNCTIONS ----------------
def get_cpu_usage():
    return psutil.cpu_percent(interval=1)


def get_memory_usage():
    return psutil.virtual_memory().percent


def get_disk_usage():
    return psutil.disk_usage('/').percent


def get_top_processes():
    processes = []

    for proc in psutil.process_iter():
        try:
            proc.cpu_percent(interval=None)
        except:
            pass

    time.sleep(1)

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
        try:
            cpu = proc.info['cpu_percent'] or 0.0
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'],
                "cpu_percent": cpu
            })
        except:
            pass

    processes.sort(key=lambda x: x["cpu_percent"], reverse=True)
    return processes[:5]


# ---------------- LOGGING ----------------
def log_txt(data):
    with open(LOG_FILE_TXT, "a") as f:
        f.write(data + "\n")


def log_csv(row):
    file_exists = False
    try:
        with open(LOG_FILE_CSV, "r"):
            file_exists = True
    except:
        pass

    with open(LOG_FILE_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def log_json(row):
    try:
        with open(LOG_FILE_JSON, "r") as f:
            data = json.load(f)
    except:
        data = []

    data.append(row)

    with open(LOG_FILE_JSON, "w") as f:
        json.dump(data, f, indent=4)


# ---------------- ALERT ----------------
def check_cpu_alert(cpu):
    if cpu > CPU_ALERT_THRESHOLD:
        return f"⚠️ ALERT: CPU usage crossed {CPU_ALERT_THRESHOLD}% ({cpu}%)"
    return None


# ---------------- MAIN LOOP ----------------
def main():
    print("Linux System Monitor Started (Ctrl+C to stop)\n")

    try:
        while True:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            cpu = get_cpu_usage()
            memory = get_memory_usage()
            disk = get_disk_usage()
            top_processes = get_top_processes()
            alert = check_cpu_alert(cpu)

            print(f"""
Time: {timestamp}
CPU: {cpu} %
Memory: {memory} %
Disk: {disk} %
""")

            if alert:
                print(alert)

            print("Top Processes:")
            for p in top_processes:
                print(f"{p['pid']} | {p['name']} | {p['cpu_percent']}%")

            row = {
                "time": timestamp,
                "cpu": cpu,
                "memory": memory,
                "disk": disk
            }

            row_json = {
                **row,
                "top_processes": top_processes
            }

            if LOG_FORMAT == "txt":
                log_txt(str(row))
            elif LOG_FORMAT == "csv":
                log_csv(row)
            else:
                log_json(row_json)

            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")


if __name__ == "__main__":
    main()
