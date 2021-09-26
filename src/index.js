'use strict';

global.L = require('leaflet');
global.$ = require('jquery');

global.VectorControlGrid = {
    Create: (MaxNativeZoom, MaxZoom, Offset, API, RoadWidth, ControlWidth, GridDepth) => require('./map.js').Create(MaxNativeZoom, MaxZoom, Offset, API, RoadWidth, ControlWidth, GridDepth)
};

global.FoxholeRouter = {
    Create: (mymap, API) => new require('./router.js').FoxholeRouter(mymap, API)
};

global.API = {
    Create: () => require('./api.js').API
};

global.FoxholeGeocoder = {
    Create: (API) => require('./geocoder.js').FoxholeGeocoder(API)
};

global.Panel = {
    Create: (APIManager, Router, Geocoder) => require('./panel.js').Panel(APIManager, Router, Geocoder)
}

var build="0af90a721677e20e7aa984dffdf91b353804d617";
window.beta = false;

var mymap = L.map('mapid',
    {
        zoomSnap: .25,
        zoomDelta: .5,
        crs: L.CRS.Simple,
        noWrap: true,
        continuousWorld: true,
        bounds: L.latLngBounds(L.latLng(-256, 0), L.latLng(0, 256)),
        autoPan: false,
        maxBounds: L.latLngBounds(L.latLng(-384, -256), L.latLng(128, 512)),
        maxZoom: 8
    });

L.imageOverlay("images/Background.webp", [[-170 - 128, -230 + 128], [170 - 128, 230 + 128]], { pane: 'imagebg', opacity: 0.4 }).addTo(mymap);

mymap.createPane('imagebg');
mymap.getPane('imagebg').style.zIndex = 50;

var urlParams = new URLSearchParams(window.location.search);
var shard = urlParams.get('shard');

var APIManager = API.Create();

var CurrentRoute = null;
var AutoZoom = false;
var IsUserZoom = true;
var IsUserZoomState;

var update_state = null;

mymap.on('moveend', function () {
    AutoZoom = false;
    if (update_state != null)
        update_state();
});

mymap.on('zoomend', function () {
    if (IsUserZoomState)
        AutoZoom = false;
    IsUserZoom = true;
    IsUserZoomState = true;
    if (update_state != null)
        update_state();
});

function PauseAutoZoom() {
    IsUserZoom = false;
    IsUserZoomState = IsUserZoom;
}

function ResumeAutoZoom() {
    IsUserZoom = true;
}

function portraitPanel() {
    return (window.innerWidth / window.innerHeight <= 3 / 4) || window.innerWidth < 700;
}

function getPanelWidth(element) {
    if (element == null)
        element = document.getElementsByClassName("leaflet-routing-container")[0];

    if (portraitPanel(element))
        return 0;

    return element.offsetWidth;
}

function getPanelHeight(element) {
    if (element == null)
        element = document.getElementsByClassName("leaflet-routing-container")[0];

    if (!portraitPanel(element))
        return 0;

    return element.offsetHeight;
}

function getPanelVisibleWidth(element) {
    if (element == null)
        element = document.getElementsByClassName("leaflet-routing-container")[0];

    if (portraitPanel(element))
        return 0;

    if (element.classList.contains("leaflet-routing-container-hide"))
        return 0;

    return element.offsetWidth;
}

function getPanelVisibleHeight(element) {
    if (element == null)
        element = document.getElementsByClassName("leaflet-routing-container")[0];

    if (!portraitPanel(element))
        return 0;

    if (element.classList.contains("leaflet-routing-container-hide"))
        return 0;

    return element.offsetHeight;
}

APIManager.update(function () {
    var Router = FoxholeRouter.Create(mymap, APIManager);
    var Geocoder = FoxholeGeocoder.Create(APIManager);
    Router.Control = Panel.Create(APIManager, Router, Geocoder).addTo(mymap);

    Router.VectorControlGrid.build = "?".concat(build);

    L.control.layers(
        {},
        {
            '<img src="images/MapIcons/MapIconStaticBase3.webp" class="layer-icon">Town Halls': Router.TownHalls,
            '<img src="images/MapIcons/MapIconSafehouse.webp" class="layer-icon">Safehouses': Router.Safehouses,
            '<img src="images/MapIcons/Control.webp" class="layer-icon">Control': Router.MapControl,
            '<img src="images/MapIcons/road-route.webp" class="layer-icon">Road Quality': Router.RoadQuality,
            '<img src="images/MapIcons/road-control.webp" class="layer-icon">Road Control': Router.RoadControl,
            '<img src="images/MapIcons/MapIconFactory.webp" class="layer-icon">Industry': Router.Industry,
            '<img src="images/MapIcons/MapIconSalvage.webp" class="layer-icon">Resources': Router.Resources,
            '<img src="images/MapIcons/Labels.webp" class="layer-icon">Labels': Router.Labels,
            '<img src="images/MapIcons/hex_icon.webp" class="layer-icon">Borders': Router.Borders
        },
        {
            position: 'topleft',
            autoZIndex: false
        }
    ).addTo(mymap);

    var startingWaypoints = [];

    // add another button
    for (let x of document.getElementsByClassName("leaflet-routing-reverse-waypoints")) {
        var copy_paste_button = document.createElement("button");
        copy_paste_button.className = "copy-paste-url-button";
        copy_paste_button.alt = "Copy URL";
        copy_paste_button.title = "Copy URL";
        copy_paste_button.appendChild(document.createElement("div"));
        x.after(copy_paste_button);
        copy_paste_button.onclick = function () {
            navigator.clipboard.writeText(location.href);
            copy_paste_button.classList.remove("dirty");
        };

        var refresh_button = document.createElement("button");
        refresh_button.className = "refresh-button";
        refresh_button.appendChild(document.createElement("div"));
        refresh_button.alt = "Refresh";
        refresh_button.title = "Refresh";
        copy_paste_button.after(refresh_button);

        refresh_button.onclick = function () {
            location.reload();
        };

        let screenshot_button = document.createElement("button");
        screenshot_button.className = "screenshot-button";
        let download_icon = document.createElement("img");
        download_icon.src = "images/download-file.svg";
        download_icon.style.width = "20px";
        download_icon.style.height = "20px";
        screenshot_button.appendChild(download_icon);
        screenshot_button.alt = "Screenshot";
        screenshot_button.title = "Save Screenshot";
        copy_paste_button.after(screenshot_button);

        let copy_button = document.createElement("button");
        copy_button.className = "copy-button";
        download_icon = document.createElement("img");
        download_icon.src = "images/copy.svg";
        download_icon.style.width = "20px";
        download_icon.style.height = "20px";
        copy_button.appendChild(download_icon);
        copy_button.alt = "Copy Image";
        copy_button.title = "Copy Image";
        copy_paste_button.after(copy_button);

        screenshot_button.onclick = () => Router.screenshot();
        copy_button.onclick = () => Router.copy();
        
        x.title = "Reverse Waypoints";
    }

    for (let y of document.getElementsByClassName("leaflet-routing-add-waypoint")) {
        y.title = "Add Waypoint";
    }

    PauseAutoZoom();
    mymap.fitBounds([[-256, 0], [0, 256]], { paddingBottomRight: [getPanelVisibleWidth(), getPanelVisibleHeight()] });
    ResumeAutoZoom();

    var waypoints = [];
    var active_layers = {};
    var no_update = false;

    function SmartAutoZoom() {
        var minX = null;
        var minY = null;
        var maxX = null;
        var maxY = null;
        var count = 0;
        var point
        for (var i = 0; i < waypoints.length; i++) {
            point = waypoints[i].latLng;
            if (point != null) {
                count++;
                if (minX == null || point.lng < minX)
                    minX = point.lng;
                if (minY == null || point.lat < minY)
                    minY = point.lat;
                if (maxX == null || point.lng > maxX)
                    maxX = point.lng;
                if (maxY == null || point.lat > maxY)
                    maxY = point.lat;
            }
        }

        if (CurrentRoute != null)
            for (i = 0; i < CurrentRoute.coordinates.length; i++) {
                point = CurrentRoute.coordinates[i];
                if (point != null) {
                    count++;
                    if (minX == null || point.lng < minX)
                        minX = point.lng;
                    if (minY == null || point.lat < minY)
                        minY = point.lat;
                    if (maxX == null || point.lng > maxX)
                        maxX = point.lng;
                    if (maxY == null || point.lat > maxY)
                        maxY = point.lat;
                }
            }

        if (count > 1) {
            var rangeX = maxX - minX;
            var rangeY = maxY - minY;
            var buffer = .05;
            PauseAutoZoom();
            mymap.fitBounds(
                [
                    [
                        minY - rangeY * buffer,
                        minX - rangeX * buffer
                    ],
                    [
                        minY + (1.0 + buffer * 2.0) * rangeY,
                        minX + (1.0 + buffer * 2.0) * rangeX
                    ]
                ],
                {
                    paddingBottomRight: [
                        getPanelVisibleWidth(),
                        getPanelVisibleHeight()
                    ]
                });
            ResumeAutoZoom();
            AutoZoom = true;
        }
    }

    window.onresize = function () {
        if (AutoZoom)
            SmartAutoZoom();
    };

    var collapse_button = document.getElementsByClassName("leaflet-routing-collapse-btn")[0];

    collapse_button.addEventListener("click", function () {
        if (AutoZoom)
            setTimeout(function () {
                SmartAutoZoom();
            }, 100);
        else {
            var element = document.getElementsByClassName("leaflet-routing-container")[0];
            var has_hide = element.classList.contains("leaflet-routing-container-hide");
            if (has_hide) { //open panel
                PauseAutoZoom();
                mymap.panBy([-getPanelWidth() * .5, -getPanelHeight() * .5], { duration: .5, animate: true, noMoveStart: true });
                ResumeAutoZoom();
            }
            else { //close panel
                PauseAutoZoom();
                mymap.panBy([getPanelWidth() * .5, getPanelHeight() * .5], { duration: .5, animate: true, noMoveStart: true });
                ResumeAutoZoom();
            }
        }
    });

    function update_state() {
        var l = "";
        for (var i = 0; i < waypoints.length; i++)
            if (waypoints[i] != null && waypoints[i].latLng != null && waypoints[i].latLng.lng != null && waypoints[i].latLng.lat != null) {
                if (i > 0)
                    l = l.concat("|");
                var s = Geocoder.reverseExact(waypoints[i].latLng);
                if (s == null)
                    l = l.concat(waypoints[i].latLng.lat.toFixed(3)).concat(",").concat(waypoints[i].latLng.lng.toFixed(3));
                else
                    l = l.concat(s);
            }

        var counter = 0;
        var keys = Object.keys(active_layers);
        for (i = 0; i < keys.length; i++)
            if (active_layers[keys[i]] === true)
                switch (keys[i].replace(/<.*> */, '')) {
                    case "Town Halls":
                        counter |= 1;
                        break;
                    case "Safehouses":
                        counter |= 2;
                        break;
                    case "Control":
                        counter |= 4;
                        break;
                    case "Road Quality":
                        counter |= 8;
                        break;
                    case "Road Control":
                        counter |= 16;
                        break;
                    case "Industry":
                        counter |= 32;
                        break;
                    case "Resources":
                        counter |= 64;
                        break;
                    case "Labels":
                        counter |= 128;
                        break;
                    case "Borders":
                        counter |= 256;
                        break;
                }

        l = l.concat(':').concat(counter.toString(16).toUpperCase());

        var bounds = mymap.getBounds();
        var zoom = mymap.getZoom();
        var W = bounds.getWest(), E = bounds.getEast(), N = bounds.getNorth(), S = bounds.getSouth();
        s = { lng: 0, lat: 0 };// mymap.unproject([getPanelWidth(), getPanelHeight()], zoom);
        var xoffset = isNaN(s.lng) ? 0 : s.lng;
        var yoffset = isNaN(s.lat) ? 0 : s.lat;

        var center = [(E + W) * .5 - .5 * xoffset, (N + S) * .5 - .5 * yoffset];

        l = l.concat(':').concat(Math.round(center[0] * 1000) / 1000).concat(',').concat(Math.round(center[1] * 1000) / 1000).concat(',').concat(zoom);

        if (location.hash != l) {
            for (let b of document.getElementsByClassName("copy-paste-url-button"))
                b.classList.add("dirty");
            location.hash = l;
        }
    }

    function createButton(label, container, image) {
        var btn = L.DomUtil.create('img', '', container);
        btn.setAttribute('src', image);
        btn.setAttribute('style', 'max-width: 32px; max-height: 32px; margin: 4px;');
        btn.innerHTML = label;
        return btn;
    }

    var mm = {
        prevent_double_click: false,
        timer: ""
    };

    mymap.on('contextmenu', function (event) {
        mm.timer = setTimeout(function () {
            if (!mm.prevent_double_click) {

                let u = document.getElementsByClassName('leaflet-control-layers')[0];
                if (u.classList.contains('leaflet-control-layers-expanded')) {
                    u.classList.remove('leaflet-control-layers-expanded');
                }
                else {
                    var container = L.DomUtil.create('div'),
                        startBtn = createButton('Start here', container, 'images/ray-start-arrow.svg'),
                        destBtn = createButton('End here', container, 'images/ray-end.svg');

                    L.DomEvent.on(startBtn, 'click', function () {
                        Router.Control.spliceWaypoints(0, 1, event.latlng);
                        mymap.closePopup();
                    });

                    L.DomEvent.on(destBtn, 'click', function () {
                        Router.Control.spliceWaypoints(Router.Control.getWaypoints().length - 1, 1, event.latlng);
                        mymap.closePopup();
                    });

                    container.setAttribute('style', 'width: 66px; padding: 0');

                    if (APIManager.calculateRegion(event.latlng.lng, event.latlng.lat) != null) {
                        L.popup()
                            .setContent(container)
                            .setLatLng(event.latlng)
                            .openOn(mymap);
                    }
                }
            }
            mm.prevent_double_click = false;
        }, 400);
    });

    mymap.doubleClickZoom.disable()
    mymap.on("dblclick", function (event) {
        var Region = APIManager.calculateRegion(event.latlng.lng, event.latlng.lat)
        if (Region != null) {
            var h = 256 / 14;
            var w = h * 2 / Math.sqrt(3);
            mymap.fitBounds(
                [
                    [
                        APIManager.remapXY(Region).y - h - 128,
                        APIManager.remapXY(Region).x + w + 128
                    ],
                    [
                        APIManager.remapXY(Region).y + h - 128,
                        APIManager.remapXY(Region).x - w + 128
                    ]
                ],
                {
                    paddingBottomRight: [
                        getPanelVisibleWidth(),
                        getPanelVisibleHeight()
                    ]
                });
        }
        clearTimeout(mm.timer);
        mm.prevent_double_click = true;
    });

    mymap.on('overlayadd', function (event) {
        if (no_update) return;
        switch (event.name.replace(/<.*> */, '')) {
            case "Control":
                Router.showControl();
                break;
            case "Road Quality":
                Router.showRoadQuality();
                break;
            case "Road Control":
                Router.showRoadControl();
                break;
            case "Labels":
                Router.showLabels();
                break;
            case "Borders":
                Router.showBorders();
                break;
        }
        active_layers[event.name.replace(/<.*> */, '')] = true;
        update_state();
    });

    mymap.on('overlayremove', function (event) {
        if (no_update) return;
        switch (event.name.replace(/<.*> */, '')) {
            case "Control":
                Router.hideControl();
                break;
            case "Road Quality":
                Router.hideRoadQuality();
                break;
            case "Road Control":
                Router.hideRoadControl();
                break;
            case "Borders":
                Router.hideBorders();
                break;
        }
        active_layers[event.name.replace(/<.*> */, '')] = false;
        update_state();
    });

    // load initial waypoints
    var points = startingWaypoints;
    var layers = 16384 * 2 - 1;

    if (typeof (location.hash) != 'undefined' && location.hash != "" && location.hash != "#") {
        var h = decodeURI(location.hash.substr(1));
        var j = h.split(':');

        // filter layers
        if (j.length > 1)
            layers = parseInt(j[1], 16);

        if (j.length > 2) {
            // set camera
            var coords = j[2].split(/,/);
            var z = parseFloat(coords[2]);
            PauseAutoZoom();

            var zoom = mymap.getZoom();
            var s = mymap.unproject([getPanelVisibleWidth(), getPanelVisibleHeight()], zoom);
            var xoffset = isNaN(s.lng) ? 0 : s.lng;
            var yoffset = isNaN(s.lat) ? 0 : s.lat;

            mymap.setView([parseFloat(coords[1]) + .5 * yoffset, parseFloat(coords[0]) + .5 * xoffset], z);
            ResumeAutoZoom();
        }

        Router.Control.on('routeselected', function (event) {
            Router.setRoute(event.route);
            CurrentRoute = event.route;
            AutoZoom = true;
            SmartAutoZoom();
        });

        h = j[0];

        var l = h.split("|");
        points = [];
        for (var i = 0; i < l.length; i++) {
            // if this is a town name locate it

            var a = l[i].split(",");
            if (a.length < 2) {
                if (a[0] != '') {
                    var u = Geocoder.lookup(a[0]);
                    points.push([u.y, u.x]);
                }
                else {
                    points.push([]);
                }
            }
            else
                points.push([parseFloat(a[0]), parseFloat(a[1])]);
        }
    }

    active_layers["Town Halls"] = (layers & 1) != 0;
    active_layers["Safehouses"] = (layers & 2) != 0;
    active_layers["Control"] = (layers & 4) != 0;
    active_layers["Road Control"] = (layers & 8) != 0;
    active_layers["Road Quality"] = (layers & 16) != 0;
    active_layers["Industry"] = (layers & 32) != 0;
    active_layers["Resources"] = (layers & 64) != 0;
    active_layers["Labels"] = (layers & 128) != 0;
    active_layers["Borders"] = (layers & 256) != 0;

    var keys = Object.keys(active_layers);
    for (i = 0; i < keys.length; i++)
        if (false == active_layers[keys[i]])
            switch (keys[i].replace(/<.*> */, '')) {
                case "Town Halls":
                    Router.TownHalls.remove();
                    break;
                case "Safehouses":
                    Router.Safehouses.remove();
                    break;
                case "Control":
                    Router.hideControl();
                    Router.MapControl.remove();
                    break;
                case "Road Quality":
                    Router.RoadQuality.remove();
                    Router.hideRoadQuality();
                    break;
                case "Road Control":
                    Router.RoadControl.remove();
                    Router.hideRoadControl();
                    break;
                case "Industry":
                    Router.Industry.remove();
                    break;
                case "Resources":
                    Router.Resources.remove();
                    break;
                case "Labels":
                    Router.Labels.remove();
                    break;
                case "Borders":
                    Router.Borders.remove();
                    Router.hideBorders();
                    break;
            }

    Router.Control.setWaypoints(points);
    waypoints = [];
    for (i = 0; i < points.length; i++)
        waypoints.push({latLng: {lat: points[i][0], lng: points[i][1]}});
    update_state();

    Router.Control.on('waypointschanged', function (event) {
        waypoints = event.waypoints;
        update_state();
        mymap.closePopup();
        AutoZoom = true;
        SmartAutoZoom();
    });
    
    Router.VectorControlGrid.on('load', function () {
        document.getElementById("map-frame").style.opacity = '1';
        document.getElementById("loader-holder").style.opacity = '0';
        setTimeout(function () { document.getElementById("loader-holder").style.display = 'none'; }, 1000);
    });
}, shard);