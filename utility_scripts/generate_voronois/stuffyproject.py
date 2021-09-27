import os
import sys
import inspect
import processing
import pathlib
from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
from qgis.core import *
from qgis.gui import *
from qgis.utils import *

print(os.getcwd())

def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(file_path):
        print('Making:'+file_path)
        os.makedirs(file_path)
    else: print('exists')

projectpath = '/Users/daanwaardenburg/Repositories/LogiWaze/utility_scripts/generate_voronois'
hexlocale=projectpath
ensure_dir(hexlocale)