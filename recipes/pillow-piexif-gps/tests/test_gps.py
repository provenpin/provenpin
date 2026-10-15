import struct

import piexif
import pytest
from PIL import ExifTags, Image

import gps


def make_jpeg(path):
    Image.new("RGB", (8, 8), "white").save(path, "jpeg")
    return path


def test_roundtrip_negative_coordinates(tmp_path):
    path = make_jpeg(tmp_path / "a.jpg")
    gps.set_gps(path, -33.8688, 151.2093)
    assert gps.read_gps(path) == pytest.approx((-33.8688, 151.2093), abs=1e-3)


def test_float_dms_seconds_are_rejected():
    exif = gps.new_exif()
    exif["GPS"] = {piexif.GPSIFD.GPSLatitude: ((51, 1), (30, 1), (12.5, 1))}
    with pytest.raises(struct.error):
        piexif.dump(exif)


def test_piexif_and_pillow_disagree_on_types(tmp_path):
    path = make_jpeg(tmp_path / "a.jpg")
    gps.set_gps(path, 51.5, -0.12)
    raw = piexif.load(str(path))["GPS"]
    pic = Image.open(path).getexif().get_ifd(ExifTags.IFD.GPSInfo)
    assert raw[piexif.GPSIFD.GPSLatitudeRef] == b"N"
    assert pic[ExifTags.GPS.GPSLatitudeRef] == "N"
    assert pic[ExifTags.GPS.GPSLatitude] == pytest.approx((51.0, 30.0, 0.0), abs=1e-3)


def test_empty_bytes_is_treated_as_a_path():
    with pytest.raises(FileNotFoundError):
        piexif.load(b"")


def test_existing_tags_survive_set_gps(tmp_path):
    path = make_jpeg(tmp_path / "a.jpg")
    exif = piexif.load(str(path))
    exif["0th"][piexif.ImageIFD.Artist] = b"me"
    piexif.insert(piexif.dump(exif), str(path))
    gps.set_gps(path, 10.0, 20.0)
    assert piexif.load(str(path))["0th"][piexif.ImageIFD.Artist] == b"me"
    assert gps.read_gps(path) == (10.0, 20.0)


def test_pillow_save_takes_dumped_bytes(tmp_path):
    exif = gps.new_exif()
    exif["GPS"] = gps.gps_ifd(48.8584, 2.2945)
    path = tmp_path / "b.jpg"
    Image.new("RGB", (8, 8)).save(path, "jpeg", exif=piexif.dump(exif))
    assert gps.read_gps(path) == pytest.approx((48.8584, 2.2945), abs=1e-3)
