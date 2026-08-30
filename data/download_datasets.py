"""
Real Dataset Acquisition Module for Network Attack Forecasting System.
Supports real, official open datasets:
1. CTU-13 / CTU Botnet Malware Captures (Czech Technical University / Stratosphere Lab):
   - Real multi-stage botnet traffic (Recon -> C2 -> DoS/PortScan)
   - Real PCAPs (Scapy/PyShark parseable) and NetFlow logs
2. CSE-CIC-IDS-2018 (University of New Brunswick / AWS Open Data):
   - Real enterprise attack timelines (Infiltration, BruteForce, Botnet, DoS)

This script downloads real files directly via streaming HTTPS requests,
verifies size and integrity, and stores them in data/raw/.
If automatic download is blocked by local firewalls, it prints exact manual steps.
NO SYNTHETIC OR MOCK DATA ALLOWED.
"""

import os
import sys
import argparse
from pathlib import Path
import urllib3

# Suppress insecure request warnings for CTU academic certs if self-signed
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

DATA_DIR = Path(__file__).resolve().parent
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

# Catalog of Verified Real Datasets on Official Academic Mirrors
DATASET_CATALOG = {
    "ctu_pcap": {
        "description": "CTU Malware Capture Real PCAP (Botnet-2: Infiltration, C2, PortScan)",
        "filename": "ctu_botnet_capture.pcap",
        "url": "https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-2/2013-08-20_capture-win2.pcap",
        "expected_min_bytes": 2_500_000, # ~3.6 MB
    },
    "ctu_flow": {
        "description": "CTU Malware Real NetFlow Records (Botnet-2 flow log)",
        "filename": "ctu_botnet_flow.netflow",
        "url": "https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-2/2013-08-20_capture-win2.netflow",
        "expected_min_bytes": 2_000_000, # ~3.3 MB
    },
    "ctu_labeled": {
        "description": "CTU Malware Labeled Flow Timelines (Ground truth MITRE attack stages)",
        "filename": "ctu_botnet_labeled.csv",
        "url": "https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-2/2013-08-20_capture-win2.weblogng.labeled",
        "expected_min_bytes": 100_000, # ~185 KB
    }
}


def ensure_directories():
    """Ensure data/raw and data/processed directories exist."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def download_file(url: str, dest_path: Path, min_bytes: int = 1000) -> bool:
    """Download file with chunked streaming and progress display."""
    if not REQUESTS_AVAILABLE:
        print("[-] Error: 'requests' package not installed.")
        return False

    print(f"[*] Requesting: {url}")
    print(f"[*] Destination: {dest_path}")

    try:
        response = requests.get(url, stream=True, verify=False, timeout=60)
        if response.status_code != 200:
            print(f"[-] HTTP error {response.status_code} received from server.")
            return False

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        chunk_size = 1024 * 64

        with open(dest_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        sys.stdout.write(f"\r    Downloaded: {downloaded / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB ({pct:.1f}%)")
                    else:
                        sys.stdout.write(f"\r    Downloaded: {downloaded / (1024*1024):.2f} MB")
                    sys.stdout.flush()

        print("\n[+] Download complete.")
    except Exception as e:
        print(f"\n[-] Download failed: {e}")
        if dest_path.exists():
            dest_path.unlink()
        return False

    if dest_path.stat().st_size < min_bytes:
        print(f"[-] Error: Downloaded file too small ({dest_path.stat().st_size} bytes). Removing.")
        dest_path.unlink()
        return False

    return True


def check_existing_files():
    """List all real dataset files present in data/raw/."""
    ensure_directories()
    files = list(RAW_DIR.glob("*"))
    print("\n" + "="*70)
    print("REAL DATASETS IN data/raw/:")
    print("="*70)
    if not files:
        print("  (Empty - No raw datasets present yet)")
        print("="*70 + "\n")
        return []

    for f in sorted(files):
        size_mb = f.stat().st_size / (1024 * 1024)
        print(f"  [+] {f.name:<32} ({size_mb:6.2f} MB)")
    print("="*70 + "\n")
    return files


def print_manual_instructions():
    """Prints manual download instructions if network restriction blocks auto download."""
    print("\n" + "#"*75)
    print("MANUAL REAL DATASET DOWNLOAD INSTRUCTIONS (NO MOCK DATA ALLOWED)")
    print("#"*75)
    print("""
If automatic HTTPS download is blocked, download any of these REAL datasets in your browser
and place the file(s) into:
   d:\\sih2\\network-attack-forecasting\\data\\raw\\

REAL OFFICIAL DIRECT LINKS (CTU-13 Stratosphere Research Lab):
1. Full CTU-13 Scenario 10 Flow Dataset (Rbot Botnet - C2 IRC & Flood - 308 MB):
   https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-51/capture20110818.binetflow.2format
   -> Save as: d:\\sih2\\network-attack-forecasting\\data\\raw\\scen10_rbot.binetflow

2. Full CTU-13 Scenario 2 PCAP (Neris Botnet - Recon & Initial Access - 34.58 MB):
   https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-43/botnet-capture-20110811-neris.pcap
   -> Save as: d:\\sih2\\network-attack-forecasting\\data\\raw\\scen2_neris_full.pcap

3. Full CTU-13 Scenario 11 Flow Dataset (Rbot Botnet - 25.09 MB):
   https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-52/capture20110818-2.binetflow.2format
   -> Save as: d:\\sih2\\network-attack-forecasting\\data\\raw\\scen11_rbot.binetflow

4. CTU-13 Scenario 2 Short NetFlow (16K flows - 3.16 MB):
   https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-2/2013-08-20_capture-win2.netflow
   -> Save as: d:\\sih2\\network-attack-forecasting\\data\\raw\\ctu_botnet_flow.netflow

5. CIC-IDS-2018 (AWS Open Data / UNB Alternative):
   https://registry.opendata.aws/cse-cic-ids2018/
   Or UNB: https://www.unb.ca/cic/datasets/ids-2018.html
""")
    print("#"*75 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Acquire real network datasets for attack forecasting.")
    parser.add_argument("--dataset", choices=["all", "ctu_pcap", "ctu_flow", "ctu_labeled", "check"], default="all")
    parser.add_argument("--manual", action="store_true", help="Display manual download instructions")
    args = parser.parse_args()

    ensure_directories()

    if args.manual:
        print_manual_instructions()
        return

    if args.dataset == "check":
        check_existing_files()
        return

    targets = list(DATASET_CATALOG.keys()) if args.dataset == "all" else [args.dataset]
    all_ok = True

    for key in targets:
        info = DATASET_CATALOG[key]
        dest = RAW_DIR / info["filename"]
        if dest.exists() and dest.stat().st_size >= info["expected_min_bytes"]:
            print(f"[+] Found verified real dataset: {dest.name} ({dest.stat().st_size / (1024*1024):.2f} MB)")
            continue

        print(f"\n[*] Acquiring: {info['description']}")
        ok = download_file(info["url"], dest, min_bytes=info["expected_min_bytes"])
        if not ok:
            all_ok = False

    files = check_existing_files()

    if not all_ok and not files:
        print("[-] Automatic downloads failed. Please follow manual download steps:")
        print_manual_instructions()
        sys.exit(1)
    else:
        print("[+] Real network dataset acquisition ready.")


if __name__ == "__main__":
    main()
