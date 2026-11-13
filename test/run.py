"""用無頭 Chrome 跑 test/index.html，把結果印出來 / Run test/index.html in headless Chrome and print the result

用法 / Usage:  python test/run.py
會自己找 Chrome（或設環境變數 CHROME 指到 chrome / chromium 的路徑）
It finds Chrome on its own (or set the CHROME environment variable to the path of chrome / chromium)
"""
import html
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = (ROOT / "test" / "index.html").as_uri()

CANDIDATES = [
    os.environ.get("CHROME", ""),
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
    shutil.which("chromium-browser") or "",
    shutil.which("chrome") or "",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]
chrome = next((c for c in CANDIDATES if c and Path(c).exists()), None)
if not chrome:
    sys.exit("找不到 Chrome / Chrome not found (set the CHROME environment variable)")

cmd = [chrome, "--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=5000", "--dump-dom", PAGE]
proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
matches = re.findall(r'<pre id="result">(.*?)</pre>', proc.stdout, re.S)
match = matches[-1] if matches else None
if not match:
    print(proc.stdout[-800:], proc.stderr[-800:])
    sys.exit("沒有拿到測試結果 / no test result found")
result = html.unescape(match)
print(result)
sys.exit(0 if result.strip().endswith("ALL PASS") else 1)
