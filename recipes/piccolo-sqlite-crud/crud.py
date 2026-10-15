from db import Album, Band
from piccolo.table import create_db_tables, drop_db_tables


async def create_schema() -> None:
    # create_db_tables emits the same DDL migrations would, and sorts
    # tables so foreign keys are created after the tables they reference.
    await create_db_tables(Band, Album, if_not_exists=True)


async def drop_schema() -> None:
    await drop_db_tables(Band, Album)


async def add_band(name: str, popularity: int = 0) -> Band:
    band = Band(name=name, popularity=popularity)
    await band.save()
    return band


async def top_bands(limit: int = 10) -> list[Band]:
    return (
        await Band.objects()
        .order_by(Band.popularity, ascending=False)
        .limit(limit)
    )


async def rename_band(band_id: int, name: str) -> dict | None:
    rows = (
        await Band.update({Band.name: name})
        .where(Band.id == band_id)
        .returning(Band.id, Band.name)
    )
    return rows[0] if rows else None


async def add_album(name: str, band: Band | int) -> Album:
    return await Album.objects().create(name=name, band=band)
