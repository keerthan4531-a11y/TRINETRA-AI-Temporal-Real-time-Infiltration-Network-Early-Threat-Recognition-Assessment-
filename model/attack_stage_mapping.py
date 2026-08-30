"""
MITRE ATT&CK Stage Mapping & Metadata.
Maps continuous state features and model class indices to standard MITRE Enterprise Tactics:
0: Benign / Normal Operation
1: Reconnaissance (T1595 - Active Scanning)
2: Initial Access (T1190 - Exploit Public-Facing Application)
3: Lateral Movement (T1021 - Remote Services / SMB / SSH)
4: Command and Control (T1071 - Application Layer Protocol / Beaconing)
5: Exfiltration (T1048 - Exfiltration Over Alternative Protocol)
"""

from typing import Dict, Any


MITRE_TACTIC_INFO = {
    0: {
        "name": "Benign",
        "tactic_id": "TA0000",
        "description": "Standard business traffic, no malicious progression detected.",
        "severity": "NORMAL",
        "color": "#10B981" # Green
    },
    1: {
        "name": "Reconnaissance",
        "tactic_id": "TA0043",
        "description": "Active port scanning, host discovery, SYN flag probing.",
        "severity": "LOW",
        "color": "#3B82F6" # Blue
    },
    2: {
        "name": "Initial Access",
        "tactic_id": "TA0001",
        "description": "Exploit delivery attempt, brute-force authentication spike.",
        "severity": "MEDIUM",
        "color": "#F59E0B" # Amber
    },
    3: {
        "name": "Lateral Movement",
        "tactic_id": "TA0008",
        "description": "Internal network traversal via SMB (port 445), RPC, or SSH sweeps.",
        "severity": "HIGH",
        "color": "#EF4444" # Red
    },
    4: {
        "name": "Command and Control",
        "tactic_id": "TA0011",
        "description": "Periodic beaconing to external attacker IP, suspicious HTTP/DNS.",
        "severity": "CRITICAL",
        "color": "#8B5CF6" # Purple
    },
    5: {
        "name": "Exfiltration",
        "tactic_id": "TA0010",
        "description": "Abnormal outbound byte transfer, bulk data egress.",
        "severity": "CRITICAL",
        "color": "#DC2626" # Deep Red
    }
}


def get_stage_metadata(stage_index: int) -> Dict[str, Any]:
    """Returns standardized MITRE metadata for a stage index."""
    return MITRE_TACTIC_INFO.get(stage_index, MITRE_TACTIC_INFO[0])
