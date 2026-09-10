"""
Zero-dependency Python HTTP Server connecting BFS & DFS algorithms to the web interface.
Uses Python's built-in `http.server` so it requires ZERO external packages (no pip installs needed).
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

# Import Python BFS and DFS implementations from the DSA directory
from DSA.bfs import find_reachable_accounts
from DSA.dfs import detect_cycles

HOST = "127.0.0.1"
PORT = 8000

class FraudEngineHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            response = {"status": "ok", "engine": "Python DSA Engine (Standard Library)"}
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        payload = json.loads(body.decode("utf-8")) if body else {}

        if self.path == "/api/bfs":
            graph = payload.get("graph", {})
            start_node = payload.get("start_node", "")
            max_hops = payload.get("max_hops", 2)
            
            # Execute Python BFS algorithm
            results = find_reachable_accounts(graph, start_node, max_hops)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            response = {"reachableAccounts": results, "source": "python"}
            self.wfile.write(json.dumps(response).encode("utf-8"))

        elif self.path == "/api/dfs":
            graph = payload.get("graph", {})
            
            # Execute Python DFS algorithm
            raw_cycles = detect_cycles(graph)
            cycles = [{"path": c} for c in raw_cycles]
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            response = {"cycles": cycles, "source": "python"}
            self.wfile.write(json.dumps(response).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Clean logging for algorithm calls
        print(f"[Python DSA Engine] {self.command} {self.path} - {args[0] if args else ''}")

def run_server():
    server = HTTPServer((HOST, PORT), FraudEngineHandler)
    print(f"==================================================")
    print(f"🚀 Python Fraud Engine Server running at http://{HOST}:{PORT}")
    print(f"📡 Serving endpoints: /api/bfs, /api/dfs, /api/health")
    print(f"💡 Ready to handle BFS/DFS requests from the website!")
    print(f"==================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

if __name__ == "__main__":
    run_server()
