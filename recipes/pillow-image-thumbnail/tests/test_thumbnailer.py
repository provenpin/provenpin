from PIL import Image
from thumbnailer import make_thumbnail


def make_jpeg(path, size, orientation=None, artist=None):
    image = Image.new("RGB", size, (200, 100, 50))
    exif = image.getexif()
    if orientation is not None:
        exif[274] = orientation
    if artist is not None:
        exif[315] = artist
    if exif:
        image.save(path, format="JPEG", exif=exif)
    else:
        image.save(path, format="JPEG")
    return path


def test_thumbnail_scales_down_keeping_aspect(tmp_path):
    src = make_jpeg(tmp_path / "src.jpg", (400, 200))
    dst = tmp_path / "thumb.jpg"
    make_thumbnail(src, dst, size=(128, 128))
    with Image.open(dst) as out:
        assert out.size == (128, 64)


def test_thumbnail_does_not_upscale(tmp_path):
    src = make_jpeg(tmp_path / "src.jpg", (100, 80))
    dst = tmp_path / "thumb.jpg"
    make_thumbnail(src, dst, size=(128, 128))
    with Image.open(dst) as out:
        assert out.size == (100, 80)


def test_orientation_applied_before_scaling(tmp_path):
    src = make_jpeg(tmp_path / "src.jpg", (400, 200), orientation=6)
    dst = tmp_path / "thumb.jpg"
    make_thumbnail(src, dst, size=(128, 128))
    with Image.open(dst) as out:
        assert out.size == (64, 128)


def test_orientation_tag_is_stripped(tmp_path):
    src = make_jpeg(tmp_path / "src.jpg", (400, 200), orientation=6)
    dst = tmp_path / "thumb.jpg"
    make_thumbnail(src, dst, size=(128, 128))
    with Image.open(dst) as out:
        assert out.getexif().get(274) is None


def test_other_exif_tags_survive(tmp_path):
    src = make_jpeg(tmp_path / "src.jpg", (400, 200), orientation=6, artist="provenpin")
    dst = tmp_path / "thumb.jpg"
    make_thumbnail(src, dst, size=(128, 128))
    with Image.open(dst) as out:
        assert out.getexif().get(315) == "provenpin"
