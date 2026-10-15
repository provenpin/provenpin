import queue
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class EventCollector(FileSystemEventHandler):
    def __init__(self):
        self.queue = queue.Queue()

    def on_any_event(self, event):
        self.queue.put(event)

    def clear(self):
        while True:
            try:
                self.queue.get_nowait()
            except queue.Empty:
                return

    def wait_for(self, predicate, timeout=5.0):
        deadline = time.monotonic() + timeout
        seen = []
        while time.monotonic() < deadline:
            try:
                event = self.queue.get(timeout=0.05)
            except queue.Empty:
                continue
            seen.append(event)
            if predicate(event):
                return event
        raise TimeoutError(f"no event matched, saw {[e.event_type for e in seen]}")


class DirectoryWatcher:
    def __init__(self, path, recursive=True):
        self.path = Path(path)
        self.collector = EventCollector()
        self.observer = Observer()
        self.observer.schedule(self.collector, str(self.path), recursive=recursive)

    def __enter__(self):
        self.observer.start()
        self._wait_ready()
        return self.collector

    def __exit__(self, *exc):
        self.observer.stop()
        self.observer.join(timeout=5)

    def _wait_ready(self, timeout=5.0):
        # Observer.start() returns before the inotify watch exists, and the
        # probe's own create/delete events are delivered asynchronously, so the
        # queue is drained explicitly to keep the next assertions clean.
        deadline = time.monotonic() + timeout
        attempt = 0
        while time.monotonic() < deadline:
            attempt += 1
            name = f".ready-{attempt}"
            probe = self.path / name
            probe.write_text("")
            try:
                self.collector.wait_for(
                    lambda e, name=name: Path(e.src_path).name == name, timeout=0.3
                )
            except TimeoutError:
                probe.unlink()
                continue
            probe.unlink()
            try:
                self.collector.wait_for(
                    lambda e, name=name: Path(e.src_path).name == name
                    and e.event_type == "deleted",
                    timeout=0.5,
                )
            except TimeoutError:
                pass
            self.collector.clear()
            return
        raise TimeoutError("observer did not become ready")
