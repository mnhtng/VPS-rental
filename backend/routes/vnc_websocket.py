"""
VNC WebSocket Proxy for Proxmox

This module provides a WebSocket proxy that forwards VNC traffic between
the browser and Proxmox VNC WebSocket, bypassing CORS and SSL certificate issues.
"""

import asyncio
import ssl
import logging
from urllib.parse import quote
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

try:
    import websockets

    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False

from backend.core import settings

router = APIRouter(prefix="/vnc", tags=["VNC WebSocket Proxy"])
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def vnc_websocket_proxy(
    websocket: WebSocket,
    node: str = Query(..., description="Proxmox node name"),
    vmid: int = Query(..., description="VM ID"),
    port: int = Query(..., description="VNC port"),
    ticket: str = Query(..., description="VNC ticket"),
    authticket: str = Query(..., description="Auth ticket"),
):
    """
    WebSocket proxy for VNC connections to Proxmox.

    This endpoint accepts WebSocket connections from the browser and forwards
    the traffic to Proxmox VNC WebSocket, handling authentication and SSL.
    """
    if not WEBSOCKETS_AVAILABLE:
        await websocket.close(code=1011, reason="websockets library not installed")
        return

    await websocket.accept()

    proxmox_host = settings.PROXMOX_HOST
    proxmox_port = settings.PROXMOX_PORT

    # Build Proxmox VNC WebSocket URL
    # Need to URL-encode the ticket for the query parameter
    encoded_ticket = quote(ticket, safe="")
    vnc_path = f"/api2/json/nodes/{node}/qemu/{vmid}/vncwebsocket?port={port}&vncticket={encoded_ticket}"
    proxmox_ws_url = f"wss://{proxmox_host}:{proxmox_port}{vnc_path}"

    logger.info(f"🔌 VNC Proxy: Connecting to Proxmox VNC for VM {vmid}")
    logger.debug(f"🔌 VNC Proxy URL: {proxmox_ws_url[:100]}...")

    # SSL context that doesn't verify certificates (for self-signed Proxmox certs)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        # Connect to Proxmox WebSocket with auth cookie
        # Use 'additional_headers' for websockets >= 12.0
        async with websockets.connect(
            proxmox_ws_url,
            ssl=ssl_context,
            additional_headers={"Cookie": f"PVEAuthCookie={authticket}"},
            ping_interval=20,
            ping_timeout=30,
            close_timeout=10,
        ) as proxmox_ws:
            logger.info(f"✅ VNC Proxy: Connected to Proxmox VNC for VM {vmid}")

            async def forward_to_proxmox():
                """Forward messages from browser to Proxmox"""
                try:
                    while True:
                        # Receive any type of message (text or bytes)
                        message = await websocket.receive()
                        if message["type"] == "websocket.receive":
                            if "bytes" in message and message["bytes"]:
                                await proxmox_ws.send(message["bytes"])
                            elif "text" in message and message["text"]:
                                await proxmox_ws.send(message["text"])
                        elif message["type"] == "websocket.disconnect":
                            logger.info("🔌 Browser sent disconnect")
                            break
                except WebSocketDisconnect:
                    logger.info("🔌 Browser disconnected")
                except Exception as e:
                    logger.error(f"❌ Error forwarding to Proxmox: {e}")

            async def forward_to_browser():
                """Forward messages from Proxmox to browser"""
                try:
                    async for data in proxmox_ws:
                        if isinstance(data, bytes):
                            await websocket.send_bytes(data)
                        else:
                            await websocket.send_text(data)
                except Exception as e:
                    logger.error(f"❌ Error forwarding to browser: {e}")

            # Run both forwarding tasks concurrently
            await asyncio.gather(
                forward_to_proxmox(), forward_to_browser(), return_exceptions=True
            )

    except websockets.exceptions.InvalidStatusCode as e:
        logger.error(f"❌ Proxmox rejected connection: {e}")
        await websocket.close(code=1008, reason=f"Proxmox auth failed: {e}")
    except Exception as e:
        logger.error(f"❌ VNC Proxy error: {e}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass


@router.get("/test")
async def test_vnc_proxy():
    """Test if VNC WebSocket proxy is available"""
    return {
        "available": WEBSOCKETS_AVAILABLE,
        "message": (
            "VNC WebSocket proxy is ready"
            if WEBSOCKETS_AVAILABLE
            else "websockets library not installed"
        ),
        "proxmox_host": settings.PROXMOX_HOST,
        "endpoint": "/api/v1/vnc/ws",
    }
