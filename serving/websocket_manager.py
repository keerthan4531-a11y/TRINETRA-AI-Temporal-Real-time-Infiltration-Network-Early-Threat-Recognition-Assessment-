"""
WebSocket Connection Manager.
Manages active real-time WebSocket client connections and broadcasts live prediction events.
"""

from fastapi import WebSocket
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger("WebSocketManager")


class WebSocketManager:
    """Handles real-time streaming to connected web frontend clients."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, data: Dict[str, Any]):
        """Broadcasts a live prediction event dictionary to all active frontend subscribers."""
        if not self.active_connections:
            return

        dead_connections = []
        payload = json.dumps(data)

        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Global singleton instance
ws_manager = WebSocketManager()
