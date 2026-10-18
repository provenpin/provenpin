import smtplib
from dataclasses import dataclass, field

@dataclass
class Notifier:
    sent: list = field(default_factory=list)

    def send(self, to: str, body: str) -> int:
        if not to:
            raise ValueError("missing recipient")
        self.sent.append((to, body))
        return len(self.sent)

def broadcast(notifier: Notifier, recipients: list, body: str) -> int:
    total = 0
    for to in recipients:
        total += notifier.send(to, body)
    return total

def send_via_smtp(host: str, port: int, to: str, body: str) -> bool:
    with smtplib.SMTP(host, port, timeout=5) as smtp:
        smtp.sendmail("noreply@example.com", [to], body)
    return True
