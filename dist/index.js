var urlParams = new URLSearchParams(window.location.search);
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

    var build="0af90a721677e20e7aa984dffdf91b353804d617";

    APIManager.update(function () {

        var Router = FoxholeRouter.Create(mymap, APIManager);

        var Geocoder = FoxholeGeocoder.Create(APIManager);

        Router.VectorControlGrid.build = "?".concat(build);

        L.control.layers(
            {},
            {
                '<img src="images/MapIcons/MapIconStaticBase3.webp" class="layer-icon">Town Halls': Router.TownHalls,
                '<img src="images/MapIcons/fencing.webp" class="layer-icon">Borders': Router.Borders,
                '<img src="images/MapIcons/road-route.webp" class="layer-icon">Road Quality': Router.RoadsCanvas,
                '<img src="images/colonial-route.webp" class="layer-icon">Colonial Roads': Router.ColonialRoads,
                '<img src="images/warden-route.webp" class="layer-icon">Warden Roads': Router.WardenRoads,
                '<img src="images/shortest-route.webp" class="layer-icon">Uncontrolled Roads': Router.NeutralRoads,
                '<img src="images/MapIcons/MapIconManufacturing.webp" class="layer-icon">Refineries': Router.Refineries,
                '<img src="images/MapIcons/MapIconFactory.webp" class="layer-icon">Factories': Router.Factories,
                '<img src="images/MapIcons/MapIconStorageFacility.webp" class="layer-icon">Storage': Router.Storage,
                '<img src="images/MapIcons/MapIconSalvage.webp" class="layer-icon">Salvage': Router.Salvage,
                '<img src="images/MapIcons/MapIconComponents.webp" class="layer-icon">Components': Router.Components,
                '<img src="images/MapIcons/MapIconFuel.webp" class="layer-icon">Fuel': Router.Fuel,
                '<img src="images/MapIcons/MapIconSulfur.webp" class="layer-icon">Sulfur': Router.Sulfur,
                '<img src="images/MapIcons/Control.webp" class="layer-icon">Control': Router.MapControl,
                '<img src="images/MapIcons/Labels.webp" class="layer-icon">Labels': Router.Labels
            },
            {
                position: 'topleft',
                autoZIndex: false
            }
        ).addTo(mymap);

        var startingWaypoints = [];

        Router.Control = Panel.Create(APIManager, Router, Geocoder).addTo(mymap);

        // add another button
        for (let x of document.getElementsByClassName("leaflet-routing-reverse-waypoints")) {
            var copy_paste_button = document.createElement("button");
            copy_paste_button.className = "copy-paste-url-button";
            copy_paste_button.alt = "Copy URL";
            copy_paste_button.title = "Copy URL";
            copy_paste_button.appendChild(document.createElement("div"));
            x.after(copy_paste_button);
            copy_paste_button.onclick = function () {
                navigator.clipboard.writeText(location.href).then(function () { });
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

        function createButton(label, container, image) {
            var btn = L.DomUtil.create('img', '', container);
            btn.setAttribute('src', image);
            btn.setAttribute('style', 'max-width: 32px; max-height: 32px; margin: 4px;');
            btn.innerHTML = label;
            return btn;
        }

        var mm = { prevent_double_click: false };

        mymap.on('click', function (e) {
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
                            Router.Control.spliceWaypoints(0, 1, e.latlng);
                            mymap.closePopup();
                        });

                        L.DomEvent.on(destBtn, 'click', function () {
                            Router.Control.spliceWaypoints(Router.Control.getWaypoints().length - 1, 1, e.latlng);
                            mymap.closePopup();
                        });

                        container.setAttribute('style', 'width: 66px; padding: 0');

                        if (APIManager.calculateRegion(e.latlng.lng, e.latlng.lat) != null) {
                            L.popup()
                                .setContent(container)
                                .setLatLng(e.latlng)
                                .openOn(mymap);
                        }
                    }
                }
                mm.prevent_double_click = false;
            }, 400);
        });

        mymap.on("dblclick", function () {
            clearTimeout(mm.timer);
            mm.prevent_double_click = true;
        });

        var waypoints = [];
        var active_layers = {};
        var no_update = false;

        function SmartAutoZoom() {
            var minX = null;
            var minY = null;
            var maxX = null;
            var maxY = null;
            var count = 0;
            for (var i = 0; i < waypoints.length; i++) {
                var u = waypoints[i].latLng;
                if (u != null) {
                    count++;
                    if (minX == null || u.lng < minX)
                        minX = u.lng;
                    if (minY == null || u.lat < minY)
                        minY = u.lat;
                    if (maxX == null || u.lng > maxX)
                        maxX = u.lng;
                    if (maxY == null || u.lat > maxY)
                        maxY = u.lat;
                }
            }

            if (CurrentRoute != null)
                for (i = 0; i < CurrentRoute.coordinates.length; i++) {
                    var u = CurrentRoute.coordinates[i];
                    if (u != null) {
                        count++;
                        if (minX == null || u.lng < minX)
                            minX = u.lng;
                        if (minY == null || u.lat < minY)
                            minY = u.lat;
                        if (maxX == null || u.lng > maxX)
                            maxX = u.lng;
                        if (maxY == null || u.lat > maxY)
                            maxY = u.lat;
                    }
                }

            if (count > 1) {
                var rangeX = maxX - minX;
                var rangeY = maxY - minY;
                var buffer = .05;
                PauseAutoZoom();
                mymap.fitBounds([[minY - rangeY * buffer, minX - rangeX * buffer], [minY + (1.0 + buffer * 2.0) * rangeY, minX + (1.0 + buffer * 2.0) * rangeX]], { paddingBottomRight: [getPanelVisibleWidth(), getPanelVisibleHeight()] });
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

        update_state = function () {
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
                        case "Borders":
                            counter |= 2;
                            break;
                        case "Warden Roads":
                            counter |= 4;
                            break;
                        case "Colonial Roads":
                            counter |= 8;
                            break;
                        case "Road Quality":
                            counter |= 16;
                            break;
                        case "Uncontrolled Roads":
                            counter |= 32;
                            break;
                        case "Refineries":
                            counter |= 64;
                            break;
                        case "Factories":
                            counter |= 128;
                            break;
                        case "Storage":
                            counter |= 256;
                            break;
                        case "Salvage":
                            counter |= 512;
                            break;
                        case "Components":
                            counter |= 1024;
                            break;
                        case "Fuel":
                            counter |= 2048;
                            break;
                        case "Sulfur":
                            counter |= 4096;
                            break;
                        case "Control":
                            counter |= 8192;
                            break;
                        case "Labels":
                            counter |= 16384;
                            break;
                        case "Basic Font":
                            counter |= 32768;
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

        mymap.on('overlayadd', function (event) {
            if (no_update) return;
            switch (event.name.replace(/<.*> */, '')) {
                case "Control":
                    Router.showControl();
                    break;
                case "Town Halls":
                    Router.showTownHalls();
                    break;
                case "Refineries":
                    Router.showRefineries();
                    break;
                case "Factories":
                    Router.showFactories();
                    break;
                case "Fuel":
                    Router.showFuel();
                    break;
                case "Components":
                    Router.showComponents();
                    break;
                case "Storage":
                    Router.showStorage();
                    break;
                case "Sulfur":
                    Router.showSulfur();
                    break;
                case "Salvage":
                    Router.showSalvage();
                    break;
                case "Warden Roads":
                    Router.showWarden();
                    break;
                case "Colonial Roads":
                    Router.showColonial();
                    break;
                case "Uncontrolled Roads":
                    Router.showNeutral();
                    break;
                case "Road Quality":
                    Router.showQuality();
                    break;
                case "Borders":
                    Router.showBorders();
                    break;
                case "Labels":
                    Router.showLabels();
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
                case "Town Halls":
                    Router.hideTownHalls();
                    break;
                case "Refineries":
                    Router.hideRefineries();
                    break;
                case "Factories":
                    Router.hideFactories();
                    break;
                case "Fuel":
                    Router.hideFuel();
                    break;
                case "Components":
                    Router.hideComponents();
                    break;
                case "Storage":
                    Router.hideStorage();
                    break;
                case "Sulfur":
                    Router.hideSulfur();
                    break;
                case "Salvage":
                    Router.hideSalvage();
                    break;
                case "Warden Roads":
                    Router.hideWarden();
                    break;
                case "Colonial Roads":
                    Router.hideColonial();
                    break;
                case "Uncontrolled Roads":
                    Router.hideNeutral();
                    break;
                case "Road Quality":
                    Router.hideQuality();
                    break;
                case "Borders":
                    Router.hideBorders();
                    break;
                case "Labels":
                    Router.hideLabels();
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

        active_layers["Road Quality"] = (layers & 16) != 0;
        active_layers["Borders"] = (layers & 2) != 0;
        active_layers["Warden Roads"] = (layers & 4) != 0;
        active_layers["Colonial Roads"] = (layers & 8) != 0;
        active_layers["Uncontrolled Roads"] = (layers & 32) != 0;
        active_layers["Refineries"] = (layers & 64) != 0;
        active_layers["Factories"] = (layers & 128) != 0;
        active_layers["Storage"] = (layers & 256) != 0;
        active_layers["Salvage"] = (layers & 512) != 0;
        active_layers["Components"] = (layers & 1024) != 0;
        active_layers["Fuel"] = (layers & 2048) != 0;
        active_layers["Sulfur"] = (layers & 4096) != 0;
        active_layers["Town Halls"] = (layers & 1) != 0;
        active_layers["Control"] = (layers & 8192) != 0;
        active_layers["Labels"] = (layers & 16384) != 0;

        var keys = Object.keys(active_layers);
        for (i = 0; i < keys.length; i++)
            if (false == active_layers[keys[i]])
                switch (keys[i].replace(/<.*> */, '')) {
                    case "Control":
                        Router.hideControl();
                        Router.MapControl.remove();
                        break;
                    case "Town Halls":
                        Router.hideTownHalls();
                        Router.TownHalls.remove();
                        break;
                    case "Borders":
                        Router.Borders.remove();
                        Router.hideBorders();
                        break;
                    case "Warden Roads":
                        Router.WardenRoads.remove();
                        Router.hideWarden();
                        break;
                    case "Colonial Roads":
                        Router.ColonialRoads.remove();
                        Router.hideColonial();
                        break;
                    case "Uncontrolled Roads":
                        Router.NeutralRoads.remove();
                        Router.hideNeutral();
                        break;
                    case "Refineries":
                        Router.hideRefineries();
                        Router.Refineries.remove();
                        break;
                    case "Factories":
                        Router.hideFactories();
                        Router.Factories.remove();
                        break;
                    case "Storage":
                        Router.Storage.remove();
                        Router.hideStorage();
                        break;
                    case "Salvage":
                        Router.Salvage.remove();
                        Router.hideSalvage();
                        break;
                    case "Components":
                        Router.Components.remove();
                        Router.hideComponents();
                        break;
                    case "Fuel":
                        Router.Fuel.remove();
                        Router.hideFuel();
                        break;
                    case "Sulfur":
                        Router.Sulfur.remove();
                        Router.hideSulfur();
                        break;
                    case "Road Quality":
                        Router.RoadsCanvas.remove();
                        Router.hideQuality();
                        break;
                    case "Labels":
                        Router.Labels.remove();
                        Router.hideLabels();
                        break;
                }

        Router.Control.setWaypoints(points);
        waypoints = [];
        for (i = 0; i < points.length; i++)
            waypoints.push({ latLng: { lat: points[i][0], lng: points[i][1] } });
        update_state();

        Router.Control.on('waypointschanged', function (event) {
            waypoints = event.waypoints;
            update_state();
            mymap.closePopup();
            AutoZoom = true;
            SmartAutoZoom();
        });

        document.getElementById("map-frame").style.opacity = '1';
        document.getElementById("loader-holder").style.opacity = '0';
        setTimeout(function () { document.getElementById("loader-holder").style.display = 'none'; }, 1000);
    }, shard);