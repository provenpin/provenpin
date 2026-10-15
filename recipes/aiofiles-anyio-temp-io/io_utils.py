import aiofiles
import anyio


async def write_lines(path, lines):
    async with aiofiles.open(path, "w", encoding="utf-8") as f:
        for line in lines:
            await f.write(f"{line}\n")


async def read_lines(path):
    async with aiofiles.open(path, encoding="utf-8") as f:
        return [line.rstrip("\n") async for line in f]


async def read_many(paths):
    results = {}

    async def read_one(p):
        results[str(p)] = await read_lines(p)

    async with anyio.create_task_group() as tg:
        for p in paths:
            tg.start_soon(read_one, p)
    return results


async def append_locked(path, lines):
    lock = anyio.Lock()

    async def append(line):
        async with lock:
            async with aiofiles.open(path, "a", encoding="utf-8") as f:
                await f.write(f"{line}\n")

    async with anyio.create_task_group() as tg:
        for line in lines:
            tg.start_soon(append, line)
