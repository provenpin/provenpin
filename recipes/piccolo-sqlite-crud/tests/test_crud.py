import sqlite3

from crud import add_album, add_band, rename_band, top_bands
from db import Album, Band
from piccolo.testing import ModelBuilder
from piccolo.testing.test_case import AsyncTableTest


class TestPiccoloCrud(AsyncTableTest):
    tables = [Band, Album]

    async def test_select_returns_dicts_and_missing_rows_return_none(self):
        await Band.insert(Band(name="Python", popularity=100))
        self.assertEqual(await Band.select(Band.name), [{"name": "Python"}])
        self.assertIsNone(
            await Band.objects().where(Band.name == "Nope").first()
        )
        self.assertIsNone(await Band.objects().get(Band.name == "Nope"))

    async def test_objects_return_rows_and_apply_ordering(self):
        await add_band("Python", 100)
        await add_band("Django", 90)
        self.assertEqual(
            [band.name for band in await top_bands()], ["Python", "Django"]
        )
        band = await Band.objects().where(Band.name == "Python").first()
        self.assertEqual(band.name, "Python")

    async def test_update_and_delete_return_nothing_without_returning(self):
        await add_band("Python", 100)
        empty = (
            await Band.update({Band.popularity: 1})
            .where(Band.name == "Python")
        )
        self.assertEqual(empty, [])
        self.assertEqual(await rename_band(1, "Py"), {"id": 1, "name": "Py"})

    async def test_foreign_key_accepts_row_instance_not_selected_dict(self):
        band = await add_band("Python", 100)
        album = await add_album("First", band)
        self.assertEqual(album.band.id, band.id)
        row = await Band.select().first()
        with self.assertRaises(sqlite3.ProgrammingError):
            await add_album("Bad", row)

    async def test_get_or_create_flags_was_created(self):
        band = await Band.objects().get_or_create(
            Band.name == "Go", defaults={Band.popularity: 70}
        )
        self.assertTrue(band._was_created)
        again = await Band.objects().get_or_create(
            Band.name == "Go", defaults={Band.popularity: 999}
        )
        self.assertFalse(again._was_created)
        self.assertEqual(again.popularity, 70)

    async def test_model_builder_persists_and_creates_parents(self):
        album = await ModelBuilder.build(Album)
        self.assertIsNotNone(album.id)
        self.assertEqual(await Band.count().run(), 1)
