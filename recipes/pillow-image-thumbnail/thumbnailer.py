from PIL import Image, ImageOps


def make_thumbnail(src, dst, size=(128, 128), quality=85):
    with Image.open(src) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail(size, Image.Resampling.LANCZOS)
        kwargs = {}
        exif = image.getexif()
        if exif:
            kwargs["exif"] = exif.tobytes()
        image.save(dst, quality=quality, **kwargs)
