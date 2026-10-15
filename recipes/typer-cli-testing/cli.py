from typing import Annotated
import typer

app = typer.Typer(no_args_is_help=True)
users = typer.Typer(help="Manage users")
app.add_typer(users, name="users")
DB: dict[str, int] = {}

@users.command("add")
def add_user(name: str, age: Annotated[int, typer.Option(min=0, max=150)] = 0):
    if name in DB:
        typer.echo(f"{name} already exists", err=True)
        raise typer.Exit(code=1)
    DB[name] = age
    typer.echo(f"added {name} ({age})")

@users.command("list")
def list_users():
    for n, a in sorted(DB.items()):
        typer.echo(f"{n}\t{a}")

@app.command()
def greet(name: Annotated[str, typer.Option(envvar="GREET_NAME")] = "world", shout: bool = False):
    msg = f"hello {name}"
    typer.echo(msg.upper() if shout else msg)

if __name__ == "__main__":
    app()
