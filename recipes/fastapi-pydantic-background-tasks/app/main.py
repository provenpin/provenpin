from fastapi import BackgroundTasks, Depends, FastAPI
from pydantic import BaseModel

class Mailer:
    def send(self, to: str, subject: str) -> None:  # real SMTP/API call goes here
        raise RuntimeError("configure a real mailer")

def get_mailer() -> Mailer:
    return Mailer()

class Signup(BaseModel):
    email: str

app = FastAPI()

@app.post("/signup", status_code=202)
def signup(data: Signup, tasks: BackgroundTasks, mailer: Mailer = Depends(get_mailer)):
    tasks.add_task(mailer.send, data.email, "Welcome!")
    return {"queued": True}
