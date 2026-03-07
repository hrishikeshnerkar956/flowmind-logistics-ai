import sqlite3
import json
from datetime import datetime
import os

class AgentMemory:
    """
    Stores agent context and historical outcomes to enable the Learning loop.
    """
    def __init__(self, db_path="data/agent_memory.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self._init_db()

    def _init_db(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS decision_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                shipment_id TEXT,
                risk_score REAL,
                action_taken TEXT,
                reasoning TEXT,
                details TEXT
            )
        ''')
        self.conn.commit()

    def log_decision(self, shipment_id: str, risk_score: float, action_taken: str, reasoning: str, details: dict):
        """
        Logs an agent decision with full reasoning to provide XAI transparency.
        """
        self.cursor.execute('''
            INSERT INTO decision_logs (timestamp, shipment_id, risk_score, action_taken, reasoning, details)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (datetime.now().isoformat(), shipment_id, risk_score, action_taken, reasoning, json.dumps(details)))
        self.conn.commit()

    def get_recent_decisions(self, limit=100):
        self.cursor.execute('SELECT * FROM decision_logs ORDER BY timestamp DESC LIMIT ?', (limit,))
        columns = [column[0] for column in self.cursor.description]
        return [dict(zip(columns, row)) for row in self.cursor.fetchall()]

    def has_recent_action(self, shipment_id: str) -> bool:
        """
        Check if an action was already taken to prevent infinite loops.
        """
        self.cursor.execute("SELECT COUNT(*) FROM decision_logs WHERE shipment_id = ?", (shipment_id,))
        count = self.cursor.fetchone()[0]
        return count > 0

    def close(self):
        self.conn.close()
