import math
from PIL import Image, ImageDraw
import os, shutil

hexwidth = 1024
hexheight = 888
sat_hexwidth = 2048
sat_hexheight = 1776

hex_dir = 'images/Hexes/'
sat_hex_dir = 'images/sat_hexes/'
hex_mask_path = 'images/alphamask.webp'
outfilepath = 'images/map.webp'
sat_outfilepath = 'images/sat_map.webp'

def hexagon_generator(edge_length, offset):
  """Generator for coordinates in a hexagon."""
  x, y = offset
  for angle in range(0, 360, 60):
    x += math.cos(math.radians(angle)) * edge_length
    y += math.sin(math.radians(angle)) * edge_length
    yield x, y

hex_mask = Image.new('RGBA', (sat_hexwidth, sat_hexheight))
draw = ImageDraw.Draw(hex_mask)
hexagon = hexagon_generator(sat_hexwidth / 2, offset = (sat_hexwidth / 4, 0))
draw.polygon(list(hexagon), outline = 'white', fill = 'white')
hex_mask.save(hex_mask_path, "webp")

#Convert files into .webp and clean up other files in source folders
for filename in os.listdir(hex_dir):
    if os.path.splitext(filename)[1] == ".TGA":
        file_path = os.path.join(hex_dir, filename)
        hexname = os.path.splitext(filename)[0]
        image = Image.open(file_path).convert('RGBA')
        image.save(hex_dir + hexname + ".webp", 'webp')
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))

#Convert files into .webp and clean up other files in source folders
for filename in os.listdir(sat_hex_dir):
    if os.path.splitext(filename)[1] == ".png":
        file_path = os.path.join(sat_hex_dir, filename)
        hexname = os.path.splitext(filename)[0]
        image = Image.open(file_path).convert('RGBA')
        image.save(sat_hex_dir + hexname + ".webp", 'webp')
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))

mapwidth = int(5.5 * hexwidth)
mapheight = int(7 * hexheight)

print("Map size " + str(mapwidth) + " px by " + str(mapheight) + " px")
oy = mapheight / 2
ox = mapwidth / 2

hexmap = Image.new('RGBA', (mapwidth, mapheight))
sat_hexmap = Image.new('RGBA', (mapwidth, mapheight))

for filename in os.listdir(hex_dir):
    if os.path.splitext(filename)[1] == ".webp":
        hexname = os.path.splitext(filename)[0]
        
        # find offset x and offset y for each imported hex
        if hexname == "MapNevishLineHex": osy, osx = oy - 1.5 * hexheight, ox - 2.25 * hexwidth
        if hexname == "MapAcrithiaHex": osy, osx = oy + 2.5 * hexheight, ox + .75 * hexwidth
        if hexname == "MapRedRiverHex": osy, osx = oy + 2.5 * hexheight, ox - .75 * hexwidth
        if hexname == "MapCallumsCapeHex": osy, osx = oy - 2 * hexheight, ox - 1.5 * hexwidth
        if hexname == "MapSpeakingWoodsHex": osy, osx = oy - 2.5 * hexheight, ox - .75 * hexwidth
        if hexname == "MapBasinSionnachHex": osy, osx = oy - 3 * hexheight, ox
        if hexname == "MapHowlCountyHex": osy, osx = oy - 2.5 * hexheight, ox + .75 * hexwidth
        if hexname == "MapClansheadValleyHex": osy, osx = oy - 2 * hexheight, ox + 1.5 * hexwidth
        if hexname == "MapMorgensCrossingHex": osy, osx = oy - 1.5 * hexheight, ox + 2.25 * hexwidth
        if hexname == "MapTheFingersHex": osy, osx = oy + 1.5 * hexheight, ox + 2.25 * hexwidth
        if hexname == "MapTerminusHex": osy, osx = oy + 2 * hexheight, ox + 1.5 * hexwidth
        if hexname == "MapKalokaiHex": osy, osx = oy + 3 * hexheight, ox
        if hexname == "MapAshFieldsHex": osy, osx = oy + 2 * hexheight, ox - 1.5 * hexwidth
        if hexname == "MapOriginHex": osy, osx = oy + 1.5 * hexheight, ox - 2.25 * hexwidth
        if hexname == "MapGodcroftsHex": osy, osx = oy - .5 * hexheight, ox + 2.25 * hexwidth
        if hexname == "MapDeadlandsHex": osy, osx = oy, ox
        if hexname == "MapReachingTrailHex": osy, osx = oy - 2 * hexheight, ox
        if hexname == "MapCallahansPassageHex": osy, osx = oy - hexheight, ox
        if hexname == "MapMarbanHollow": osy, osx = oy - .5 * hexheight, ox + .75 * hexwidth
        if hexname == "MapUmbralWildwoodHex": osy, osx = oy + hexheight, ox
        if hexname == "MapHeartlandsHex": osy, osx = oy + 1.5 * hexheight, ox - .75 * hexwidth
        if hexname == "MapLochMorHex": osy, osx = oy + .5 * hexheight, ox - .75 * hexwidth
        if hexname == "MapLinnMercyHex": osy, osx = oy - .5 * hexheight, ox - .75 * hexwidth
        if hexname == "MapStonecradleHex": osy, osx = oy - hexheight, ox - 1.5 * hexwidth
        if hexname == "MapFarranacCoastHex": osy, osx = oy, ox - 1.5 * hexwidth
        if hexname == "MapWestgateHex": osy, osx = oy + hexheight, ox - 1.5 * hexwidth
        if hexname == "MapFishermansRowHex": osy, osx = oy + .5 * hexheight, ox - 2.25 * hexwidth
        if hexname == "MapOarbreakerHex": osy, osx = oy - .5 * hexheight, ox - 2.25 * hexwidth
        if hexname == "MapGreatMarchHex": osy, osx = oy + 2 * hexheight, ox
        if hexname == "MapTempestIslandHex": osy, osx = oy + .5 * hexheight, ox + 2.25 * hexwidth
        if hexname == "MapEndlessShoreHex": osy, osx = oy, ox + 1.5 * hexwidth
        if hexname == "MapAllodsBightHex": osy, osx = oy + hexheight, ox + 1.5 * hexwidth
        if hexname == "MapWeatheredExpanseHex": osy, osx = oy - hexheight, ox + 1.5 * hexwidth
        if hexname == "MapDrownedValeHex": osy, osx = oy + .5 * hexheight, ox + .75 * hexwidth
        if hexname == "MapShackledChasmHex": osy, osx = oy + 1.5 * hexheight, ox + .75 * hexwidth
        if hexname == "MapViperPitHex": osy, osx = oy - 1.5 * hexheight, ox + .75 * hexwidth
        if hexname == "MapMooringCountyHex": osy, osx = oy - 1.5 * hexheight, ox - .75 * hexwidth

        #open hex image file and paste into source map image
        file_path = os.path.join(hex_dir, filename)
        hex_image = Image.open(file_path).convert('RGBA')
        hexmap.paste(hex_image, (int(osx - hexwidth / 2), int(osy - hexheight / 2)), hex_image)

        #height offset required for cropping square image to hex image
        satosy = (sat_hexwidth - sat_hexheight) / 2

        #open hex image file and paste into source map image after cropping and resizing
        sat_file_path = os.path.join(sat_hex_dir, filename)
        sat_hex_image = Image.open(sat_file_path).convert('RGBA')
        sat_hex_image = sat_hex_image.crop((0, 0 + satosy, sat_hexwidth, sat_hexheight + satosy))
        sat_hex_image = sat_hex_image.resize((hexwidth, hexheight), Image.BICUBIC)
        sat_hexmap.paste(sat_hex_image, (int(osx - hexwidth / 2), int(osy - hexheight / 2)), hex_image)

        print("Placed " + hexname.replace('Map','').replace('Hex',' Hex'))
        
hexmap.save(outfilepath, 'webp')
sat_hexmap.save(sat_outfilepath, 'webp')
