import aiofiles
import anyio
import pytest
from io_utils import append_locked, read_lines, read_many, write_lines


async def test_roundtrip_write_then_read(tmp_path):
    p = tmp_path / "a.txt"
    await write_lines(p, ["x", "y"])
    assert await read_lines(p) == ["x", "y"]


async def test_concurrent_reads_with_task_group(tmp_path):
    paths = []
    for i in range(5):
        p = tmp_path / f"{i}.txt"
        await write_lines(p, [f"line-{i}"])
        paths.append(p)
    got = await read_many(paths)
    assert len(got) == 5 and got[str(paths[3])] == ["line-3"]


async def test_write_after_close_raises(tmp_path):
    f = await aiofiles.open(tmp_path / "b.txt", "w", encoding="utf-8")
    await f.write("hello")
    await f.close()
    with pytest.raises(ValueError):
        await f.write("again")


async def test_anyio_lock_serializes_appends(tmp_path):
    p = tmp_path / "log.txt"
    await append_locked(p, [str(n) for n in range(50)])
    assert sorted(await read_lines(p), key=int) == [str(n) for n in range(50)]


async def test_anyio_path_interops_with_aiofiles(tmp_path):
    p = tmp_path / "c.txt"
    await anyio.Path(p).write_text("from anyio")
    assert await read_lines(p) == ["from anyio"]


async def test_task_group_wraps_errors_in_exception_group(tmp_path):
    with pytest.raises(ExceptionGroup):
        await read_many([tmp_path / "missing.txt"])
