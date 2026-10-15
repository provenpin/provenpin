import piexif
from PIL import Image


def new_exif():
    return {"0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": None}


def gps_ifd(latitude, longitude):
    return {
        piexif.GPSIFD.GPSVersionID: (2, 3, 0, 0),
        piexif.GPSIFD.GPSLatitudeRef: b"N" if latitude >= 0 else b"S",
        piexif.GPSIFD.GPSLatitude: _dms(latitude),
        piexif.GPSIFD.GPSLongitudeRef: b"E" if longitude >= 0 else b"W",
        piexif.GPSIFD.GPSLongitude: _dms(longitude),
    }


def _dms(value):
    value = abs(value)
    degrees = int(value)
    minutes = int((value - degrees) * 60)
    seconds = (value - degrees - minutes / 60) * 3600
    return ((degrees, 1), (minutes, 1), (round(seconds * 10000), 10000))


def _degrees(rationals):
    (d, dn), (m, mn), (s, sn) = rationals
    return d / dn + m / mn / 60 + s / sn / 3600


def set_gps(path, latitude, longitude):
    exif = piexif.load(str(path))
    exif["GPS"] = gps_ifd(latitude, longitude)
    piexif.insert(piexif.dump(exif), str(path))


def read_gps(path):
    gps = piexif.load(str(path))["GPS"]
    if not gps:
        return None
    latitude = _degrees(gps[piexif.GPSIFD.GPSLatitude])
    longitude = _degrees(gps[piexif.GPSIFD.GPSLongitude])
    if gps[piexif.GPSIFD.GPSLatitudeRef] in (b"S", "S"):
        latitude = -latitude
    if gps[piexif.GPSIFD.GPSLongitudeRef] in (b"W", "W"):
        longitude = -longitude
    return latitude, longitude
