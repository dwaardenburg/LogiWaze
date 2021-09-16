'use strict';

global.L = require('leaflet');
global.$ = require('jquery');

global.VectorControlGrid = {
    Create: (MaxZoom, Offset, API, RoadWidth, ControlWidth, GridDepth) => require('./IVectorControlGrid.js').Create(MaxZoom, Offset, API, RoadWidth, ControlWidth, GridDepth)
};

global.VectorTextGrid = {
    Create: (MaxZoom, Offset) => require('./IVectorTextGrid.js').Create(MaxZoom, Offset)
};

global.FoxholeRouter = {
    Create: (mymap, API) => new require('./IRouter.js').FoxholeRouter(mymap, API)
};

global.API = {
    Create: () => require('./API.js').API
};

global.FoxholeGeocoder = {
    Create: (API) => require('./IGeocoder.js').FoxholeGeocoder(API)
};

global.Panel = {
    Create: (APIManager, Router, Geocoder) => require('./Panel.js').Panel(APIManager, Router, Geocoder)
}
