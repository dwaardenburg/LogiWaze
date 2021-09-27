import math
from PIL import Image

resampling_filter = Image.LANCZOS

source = 'images/MapIcons/MapIconCoastalGun.tga'
target = 'images/MapIcons/MapIconCoastalGun'

image = Image.open(source).convert('RGBA')
image = image.resize((48, 42), resampling_filter)
image.save(target + ".png", 'png')