import logging
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import threading
import time
import os
import asyncio


logger = logging.getLogger("AriaObservatory")

class AriaObservatory:
    def __init__(self, master):
        self.master = master
        # Find templates folder relative to this file
        template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
        self.app = Flask(__name__, template_folder=template_dir)
        self.socketio = SocketIO(self.app, cors_allowed_origins="*", async_mode='threading')
        self.setup_routes()
        self.thread = None

    def setup_routes(self):
        @self.app.route('/')
        def index():
            return render_template('observatory.html')

        @self.app.route('/api/journal', methods=['POST'])
        def post_journal():
            from flask import request
            data = request.json
            entry = data.get("entry", "")
            # Trigger the kernel to process this reflection
            asyncio.run_coroutine_threadsafe(
                self.master.memory.store_memory(f"User Reflection: {entry}", "episodic", 0.9),
                self.master.loop
            )
            return {"status": "recorded"}

    def start(self, host="127.0.0.1", port=5000):
        logger.info(f"🛰️  ARIA OBSERVATORY: Deploying eyes to http://{host}:{port}")

        def run_server():
            try:
                self.socketio.run(self.app, host=host, port=port, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)
            except Exception as e:
                logger.error(f"Observatory failure: {e}")

        self.thread = threading.Thread(target=run_server)
        self.thread.daemon = True
        self.thread.start()

    def broadcast_update(self, event_type, data):
        """Send real-time updates to the frontend."""
        try:
            self.socketio.emit('soul_update', {'type': event_type, 'data': data})
        except:
            pass
