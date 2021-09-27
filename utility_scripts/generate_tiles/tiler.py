from PIL import Image
import math
import os, shutil

tile_size = 256
source_img = Image.open('images/sat_map.webp')
target_dir = 'images/sat_tiles/'

# clear target tile folder
for filename in os.listdir(target_dir):
    file_path = os.path.join(target_dir, filename)
    try:
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)
    except Exception as e:
        print('Failed to delete %s. Reason: %s' % (file_path, e))

src_dim = source_img.size

max_dim = max(src_dim[0], src_dim[1]) # find biggest dimension
min_dim = 2 ** (math.ceil(math.log(max_dim) / math.log(2))) # find minimal multiple of tile size larger than the source image

# create target image and paste source image
target_img = Image.new('RGBA', (int(min_dim), int(min_dim)))
trg_dim = target_img.size
print("Resized %s by %s px map to %s by %s px" % (src_dim[0], src_dim[1], trg_dim[0], trg_dim[1]))

# resize source image preserving while aspect ratio
if src_dim[0] < src_dim[1]:
	source_img = source_img.resize((int(src_dim[0] * min_dim / src_dim[1]), min_dim), Image.BICUBIC)
	src_dim = source_img.size
	target_img.paste(source_img, (int((trg_dim[0] - src_dim[0]) / 2), 0))
else:
	source_img = source_img.resize((min_dim, int(src_dim[1] * min_dim / src_dim[0])), Image.BICUBIC)
	src_dim = source_img.size
	target_img.paste(source_img, (0, int((trg_dim[1] - src_dim[1]) / 2)))

target_img.save("images/resized_map.webp", 'webp')

# find max zoom level
max_zoom_lvl = math.ceil(math.log(max_dim / tile_size) / math.log(2))

for z in range(max_zoom_lvl + 1):
	print("Cropping %s tiles for zoom level %s" % (math.floor(trg_dim[0] / tile_size), max_zoom_lvl - z))
	x_coord = 0
	for x in range(0, trg_dim[0] - 1, tile_size):
		y_coord = 0
		for y in range(0, trg_dim[1] - 1, tile_size):
			tile = target_img.crop((x, y, x + tile_size, y + tile_size))
			tile.save(str(target_dir) + "/" + str(max_zoom_lvl - z) + "_" + str(x_coord) + "_" + str(y_coord) + ".webp", 'webp')
			y_coord = y_coord + 1
		x_coord = x_coord + 1
	target_img = target_img.resize((int(trg_dim[0] / 2), int(trg_dim[1] / 2)))
	trg_dim = target_img.size
	print("Resized map to %s by %s px" % trg_dim)