"""
SQLite Storage Module for Real Prediction Time Series.
Lightweight local relational storage for historical queries and audit logging.
Provides structured audit reporting and breakdown statistics over real telemetry forecasts.
"""

import sys
import sqlite3
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class PredictionDatabase:
    """Stores inference event time series in a local SQLite file."""

    def __init__(self, db_path: str = "data/predictions.db"):
        self.db_path = Path(db_path)
        if not self.db_path.is_absolute():
            self.db_path = PROJECT_ROOT / self.db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_schema()

    def get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect(str(self.db_path))

    def init_schema(self):
        """Initializes the predictions table schema."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                infil_probability REAL NOT NULL,
                predicted_mitre_stage TEXT NOT NULL,
                tactic_id TEXT NOT NULL,
                severity TEXT NOT NULL,
                trajectory_json TEXT NOT NULL,
                top_features_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_pred_ts ON predictions(timestamp);")
            conn.commit()

    def record_prediction(self, pred_data: Dict[str, Any]):
        """Persists a real prediction record into SQLite."""
        if not pred_data:
            raise ValueError("[!] Cannot insert empty prediction into database.")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO predictions (
                timestamp, infil_probability, predicted_mitre_stage,
                tactic_id, severity, trajectory_json, top_features_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                float(pred_data.get("timestamp", 0.0)),
                float(pred_data.get("current_infil_probability", 0.0)),
                str(pred_data.get("predicted_mitre_stage", "Benign")),
                str(pred_data.get("tactic_id", "TA0000")),
                str(pred_data.get("stage_severity", "NORMAL")),
                json.dumps(pred_data.get("future_trajectory", [])),
                json.dumps(pred_data.get("top_driving_features", []))
            ))
            conn.commit()

    def get_recent_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieves latest prediction history."""
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, timestamp, infil_probability, predicted_mitre_stage,
                   tactic_id, severity, trajectory_json, top_features_json, created_at
            FROM predictions
            ORDER BY id DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def get_recent_predictions(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Alias for get_recent_history."""
        return self.get_recent_history(limit=limit)

    def get_audit_summary(self) -> Dict[str, Any]:
        """Queries and aggregates real prediction history for audit reporting."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # 1. Total records and time bounds
            cursor.execute("""
            SELECT COUNT(*), MIN(timestamp), MAX(timestamp),
                   MIN(infil_probability), MAX(infil_probability), AVG(infil_probability)
            FROM predictions
            """)
            row = cursor.fetchone()
            total_count = row[0] or 0
            min_ts = row[1] or 0.0
            max_ts = row[2] or 0.0
            min_prob = row[3] or 0.0
            max_prob = row[4] or 0.0
            avg_prob = row[5] or 0.0

            # 2. Stage breakdown
            cursor.execute("""
            SELECT predicted_mitre_stage, tactic_id, COUNT(*),
                   ROUND(AVG(infil_probability) * 100, 1),
                   ROUND(MAX(infil_probability) * 100, 1)
            FROM predictions
            GROUP BY predicted_mitre_stage, tactic_id
            ORDER BY COUNT(*) DESC
            """)
            stage_rows = cursor.fetchall()
            stages = []
            for sr in stage_rows:
                pct = (sr[2] / total_count * 100) if total_count > 0 else 0.0
                stages.append({
                    "stage": sr[0],
                    "tactic_id": sr[1],
                    "count": sr[2],
                    "percentage": round(pct, 1),
                    "avg_risk_pct": sr[3],
                    "peak_risk_pct": sr[4]
                })

            # 3. Severity breakdown
            cursor.execute("""
            SELECT severity, COUNT(*)
            FROM predictions
            GROUP BY severity
            ORDER BY COUNT(*) DESC
            """)
            sev_rows = cursor.fetchall()
            severities = {r[0]: r[1] for r in sev_rows}

            # 4. Critical alerts (>= 0.75 threshold)
            cursor.execute("SELECT COUNT(*) FROM predictions WHERE infil_probability >= 0.75")
            alert_count = cursor.fetchone()[0] or 0

            return {
                "total_predictions": total_count,
                "time_span_seconds": round(max_ts - min_ts, 2) if max_ts > min_ts else 0.0,
                "first_event_timestamp": min_ts,
                "last_event_timestamp": max_ts,
                "min_infiltration_risk": round(min_prob, 4),
                "max_infiltration_risk": round(max_prob, 4),
                "avg_infiltration_risk": round(avg_prob, 4),
                "escalated_alerts_count": alert_count,
                "stage_breakdown": stages,
                "severity_breakdown": severities
            }

    def print_audit_report(self):
        """Prints a rich, formatted audit report of real SQLite records."""
        summary = self.get_audit_summary()

        print("=" * 75)
        print("  SQLITE REAL PREDICTION AUDIT LOG & HISTORICAL TELEMETRY REPORT")
        print("  Database Path: " + str(self.db_path))
        print("=" * 75)

        print(f"Total Stored Predictions : {summary['total_predictions']:,}")
        print(f"Telemetry Time Span      : {summary['time_span_seconds']:.1f} seconds")
        print(f"Infiltration Risk Range  : {summary['min_infiltration_risk']*100:.1f}% to {summary['max_infiltration_risk']*100:.1f}%")
        print(f"Average Infiltration Risk: {summary['avg_infiltration_risk']*100:.1f}%")
        print(f"Escalated Alerts (>=75%) : {summary['escalated_alerts_count']} events")
        print("-" * 75)

        print("PREDICTED MITRE ATT&CK STAGE BREAKDOWN:")
        print(f"  {'Stage Name':<22} | {'Tactic ID':<10} | {'Count':<7} | {'Share %':<8} | {'Avg Risk':<9} | {'Peak Risk':<9}")
        print("  " + "-" * 71)
        for s in summary["stage_breakdown"]:
            print(f"  {s['stage']:<22} | {s['tactic_id']:<10} | {s['count']:<7} | {s['percentage']:>6.1f}% | {s['avg_risk_pct']:>7.1f}% | {s['peak_risk_pct']:>7.1f}%")

        print("-" * 75)
        print("SEVERITY DISTRIBUTION:")
        for sev, count in summary["severity_breakdown"].items():
            pct = (count / summary['total_predictions'] * 100) if summary['total_predictions'] > 0 else 0
            print(f"  [{sev:<8}] : {count:>5} events ({pct:>5.1f}%)")

        print("=" * 75)

    def clear_history(self):
        """Truncates prediction history."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM predictions;")
            conn.commit()


def main():
    parser = argparse.ArgumentParser(description="SQLite Prediction Database Audit Reporter")
    parser.add_argument("--db", type=str, default="data/predictions.db", help="Path to predictions SQLite file")
    parser.add_argument("--clear", action="store_true", help="Truncate table")
    args = parser.parse_args()

    db = PredictionDatabase(args.db)
    if args.clear:
        db.clear_history()
        print("[+] Prediction history cleared.")
    else:
        db.print_audit_report()


if __name__ == "__main__":
    main()
