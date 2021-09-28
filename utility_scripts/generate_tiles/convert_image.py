import math
from PIL import Image

resampling_filter = Image.LANCZOS

source = 'images/MapIcons/globe_icon.jpeg'
target = 'images/MapIcons/globe_icon'

image = Image.open(source).convert('RGBA')
image = image.resize((48, 48), resampling_filter)
image.save(target + ".webp", 'webp')