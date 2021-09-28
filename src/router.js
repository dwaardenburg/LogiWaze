define(['leaflet', 'json-loader!../json/live_roads.geojson', './geojson-path-finder/index.js', '../json/towns.json'],
    function (L, Paths, PathFinder, towns) {
        return {
            FoxholeRouter: function (mymap, API) {
                var JSONRoads = L.geoJSON(Paths);

                var MainRoutes = {crs: Paths.crs, features: [], type: "FeatureCollection", filter: Paths.filter};
                var WardenRoutes = {crs: Paths.crs, features: [], type: "FeatureCollection", filter: Paths.filter};
                var ColonialRoutes = {crs: Paths.crs, features: [], type: "FeatureCollection", filter: Paths.filter};

                var Intersections = {};
                var BorderCache = {};
                var BorderCrossings = {};

                var ControlLayer = VectorControlGrid.Create('cartographic', 5, 8, [128, 128], API, .30, .17, 6);
                var SatelliteLayer = VectorControlGrid.Create('satellite', 5, 8, [128, 128], API, .30, .17, 6);
                var hex_height = 256 / 7;
                var hex_width = hex_height * 2 / Math.sqrt(3);
                
                var road_keys = Object.keys(JSONRoads._layers);
                var highlighter = L.layerGroup().addTo(mymap);

                var i, key, data, icon, resource, region

                API.regions.forEach(region => ControlLayer.addHex(region.x, -region.y, hex_width, hex_height, !(region.name in API.mapControl)));
                API.regions.forEach(region => SatelliteLayer.addHex(region.x, -region.y, hex_width, hex_height, !(region.name in API.mapControl)));

                var resolveResource = function (icon) {
                    if (icon.id == null)
                        return null;

                    if (icon.id == 20)
                        return 'MapIconSalvage.webp';
                    if (icon.id == 21)
                        return 'MapIconComponents.webp';
                    if (icon.id == 23)
                        return 'MapIconSulfur.webp';
                    if (icon.id == 32)
                        return 'MapIconSulfurMine.webp';
                    if (icon.id == 38)
                        return 'MapIconSalvageMine.webp';
                    if (icon.id == 40)
                        return 'MapIconComponentMine.webp';
                    if (icon.id == 41)
                        return 'MapIconOilWell.webp';

                    return 'road-control.webp';
                }

                let resource_icons = []
                for (i of Object.keys(API.resources)) {
                    resource = API.resources[i];
                    for (key of Object.keys(resource)) {
                        data = {
                            id: resource[key].mapIcon,
                            control: resource[key].control
                        };
                        icon = resolveResource(data);
                        // if (resource[key].nuked) {
                        //     IconLayer.addIcon(icon, resource[key].x, resource[key].y, resource[key].nuked, 0, 9);
                        // }
                        // IconLayer.addIcon(icon, resource[key].x, resource[key].y, false, 0, 9);
                        resource_icons.push(L.marker([resource[key].y - 128, resource[key].x + 128], {
                            clickable: true,
                            icon: L.icon({
                                iconUrl: 'images/MapIcons/'.concat(icon),
                                iconSize: [10, 10],
                                alt: String(data.id),
                                className: "map-icon"
                            })
                        }).bindPopup(String(data.id)));
                    }
                }

                mymap.on('zoomend', () => {scale_icon()});
                mymap.on('zoomanim', () => {scale_labels()});
                ControlLayer.on('load', () => {scale_labels()});
                SatelliteLayer.on('load', () => {scale_labels()});

                function scale_labels() {
                    var zoom = mymap.getZoom();
                    var elements = document.getElementsByClassName('region-label');
                    visible = (zoom >= 0 && zoom < 3.5) ? 'block' : 'none';
                    if (elements != null)
                        for (i = 0; i < elements.length; i++)
                            elements[i].style["display"] = visible;

                    elements = document.getElementsByClassName('town-label');
                    var visible = zoom >= 3.5 ? 'block' : 'none';
                    if (elements != null)
                        for (i = 0; i < elements.length; i++)
                            elements[i].style["display"] = visible;

                    elements = document.getElementsByClassName('minor-town-label');
                    visible = zoom >= 6 ? 'block' : 'none';
                    if (elements != null)
                        for (i = 0; i < elements.length; i++)
                            elements[i].style["display"] = visible;
                    elements = document.getElementsByClassName('credit-label');
                    visible = zoom >= 7 ? 'block' : 'none';
                    if (elements != null)
                        for (i = 0; i < elements.length; i++)
                            elements[i].style["display"] = visible;
                }
                
                var iconRuleIndex = 0;
                function scale_icon() {
                    var zoom = mymap.getZoom();
                    var scale = Math.round(24 * Math.sqrt(zoom / 6));
                    var stylesheet = document.styleSheets[1];

                    stylesheet.deleteRule(iconRuleIndex);
                    var rule = ".map-icon {width: ".concat(scale.toFixed()).concat("px !important;")
                    .concat("height: ").concat(scale.toFixed()).concat("px !important;")
                    .concat("margin-left: ").concat((- scale / 2).toFixed()).concat("px !important;")
                    .concat("margin-top: ").concat((- scale / 2).toFixed()).concat("px !important;")
                    iconRuleIndex = stylesheet.insertRule(rule, iconRuleIndex);
                }

                var resolveIcon = function (icon) {
                    if (icon.id == null)
                        return null;

                    if (icon.id == 56 || icon.id == 5)
                        icon.name = 'MapIconStaticBase1';
                    else if (icon.id == 35)
                        icon.name = "MapIconSafehouse";
                    else if (icon.id == 57 || icon.id == 6)
                        icon.name = 'MapIconStaticBase2';
                    else if (icon.id == 58 || icon.id == 7)
                        icon.name = 'MapIconStaticBase3';
                    else if (icon.id == 27)
                        icon.name = 'MapIconKeep'
                    else if (icon.id >= 45 && icon.id <= 47)
                        icon.name = 'MapIconRelicBase';
                    else if (icon.id == 17)
                        icon.name = 'MapIconManufacturing';
                    else if (icon.id == 51)
                        icon.name = 'MapIconMassProductionFactory';
                    else if (icon.id == 34)
                        icon.name = 'MapIconFactory';
                    else if (icon.id == 33)
                        icon.name = 'MapIconStorageFacility';
                    else if (icon.id == 39)
                        icon.name = 'MapIconConstructionYard';
                    else if (icon.id == 52)
                        icon.name = 'MapIconSeaport';
                    else if (icon.id == 11)
                        icon.name = 'MapIconMedical';
                    else if (icon.id == 12)
                        icon.name = 'MapIconVehicle';
                    else if (icon.id == 18)
                        icon.name = 'MapIconShipyard';
                    else if (icon.id == 28)
                        icon.name = 'MapIconObservationTower';
                    else if (icon.id == 19)
                        icon.name = 'MapIconTechCenter';
                    else if (icon.id == 53)
                        icon.name = 'MapIconCoastalGun';
                    else if (icon.id == 37)
                        icon.name = 'MapIconRocketSite';
                    else
                        return null;

                    if (icon.control == "WARDENS")
                        icon.name = icon.name.concat('Warden');
                    else if (icon.control == "COLONIALS")
                        icon.name = icon.name.concat('Colonial');
                    else if (icon.control == "NONE");
                    else
                        return null;

                    return icon.name.concat('.webp');
                };

                let town_icons = []
                let safehouse_icons = []
                let industry_icons = []
                var iconLayer
                for (i of Object.keys(API.mapControl)) {
                    region = API.mapControl[i];
                    for (key of Object.keys(region)) {
                        data = {
                            id: region[key].mapIcon,
                            control: region[key].control
                        };
                        icon = resolveIcon(data);
                        if (data.id == 56 || data.id == 57 || data.id == 58 || data.id == 5 || data.id == 6 || data.id == 7 || data.id >= 45 && data.id <= 47)
                            iconLayer = town_icons;
                        else if (data.id == 35)
                            iconLayer = safehouse_icons;
                        else
                            iconLayer = industry_icons;
                        iconLayer.push(L.marker([region[key].y - 128, region[key].x + 128], {
                            clickable: true,
                            icon: L.icon({
                                iconUrl: 'images/MapIcons/'.concat(icon),
                                iconSize: [10, 10],
                                alt: String(data.id),
                                className: "map-icon"
                            })
                        }).bindPopup(String(data.id)));
                    }
                }  
                
                var labels = []
                for (key of Object.keys(towns)) {
                    if (towns[key].major == 1)
                        labels.push(new L.Marker([towns[key].y - 128, towns[key].x + 128], { icon: new L.DivIcon({ className: 'town-label', html: '<span>'.concat(key).concat('</span>') }), zIndexOffset: 1000 }).addTo(mymap));
                    else
                        labels.push(new L.Marker([towns[key].y - 128, towns[key].x + 128], { icon: new L.DivIcon({ className: 'minor-town-label', html: '<span>'.concat(key).concat('</span>') }), zIndexOffset: 1000 }).addTo(mymap));
                }

                for (var api_region of API.regions) {
                    labels.push(new L.Marker([api_region.y - 128, api_region.x + 128], {icon: new L.DivIcon({ className: 'region-label', html: '<span>'.concat(api_region.realName).concat('</span>')}), zIndexOffset: 1000}).addTo(mymap));
                }

                for (var credit of [ // wow these are all wrong now
                    {text: "Hayden Grove", x: (139.079 - 128) * 0.90726470872655477280009094078879, y: (-155.292 + 128) * 0.90726470872655477280009094078879},
                    {text: "Steely Phil Bridge", x: (18.18 - 128) * 0.90726470872655477280009094078879, y: (-161.439 + 128) * 0.90726470872655477280009094078879},
                    {text: "Icanari Killing Fields", x: (134.071 - 128) * 0.90726470872655477280009094078879, y: (-143.104 + 128) * 0.90726470872655477280009094078879},
                    {text: "Kastow Peak", x: (124.817 - 128) * 0.90726470872655477280009094078879, y: (-122.72 + 128) * 0.90726470872655477280009094078879},
                    {text: "DragonZephyr Col", x: (119.176 - 128) * 0.90726470872655477280009094078879, y: (-83.464 + 128) * 0.90726470872655477280009094078879},
                    {text: "Skaj Sound", x: (49.826 - 128) * 0.90726470872655477280009094078879, y: (-102.048 + 128) * 0.90726470872655477280009094078879},
                    {text: "Inquisitor Silenus Trail", x: 75.701 - 128, y: -123.834 + 128},
                    {text: "Antraxen's Drive", x: 217.082 - 128, y: -136.754 + 128},
                    {text: "Fork of Malarthyn", x: 70.279 - 128, y: -103.977 + 128},
                    {text: "Maybar's Finesse", x: 158.151 - 128, y: -101.223 + 128}

                ]) {
                    labels.push(new L.Marker([credit.y - 128, credit.x + 128], {icon: new L.DivIcon({className: 'credit-label', html: '<span>'.concat(credit.text).concat('</span>')}), zIndexOffset: 1000}).addTo(mymap));
                }

                for (i = 0; i < Paths.features.length; i++) {
                    var feature = Paths.features[i];
                    var scratch = {};
                    for (var j = 0; j < feature.geometry.coordinates.length; j++) {
                        var point = feature.geometry.coordinates[j];
                        var hash = point[0].toFixed(3).concat("|").concat(point[1].toFixed(3));
                        if (scratch[hash] === true) {
                            feature.geometry.coordinates.splice(j, 1);
                            j--;
                        }
                        else
                            scratch[hash] = true;
                    }
                    if (feature.geometry.coordinates.length < 2) {
                        Paths.features.splice(i, 1);
                        road_keys.splice(i, 1);
                        i--;
                    }
                }

                for (i = 0; i < Paths.features.length; i++) {
                    feature = Paths.features[i];
                    var warden_features = [];
                    var colonial_features = [];
                    var all_features = [];
                    var last_ownership = "NONE";
                    var last_point = null;
                    var ownership

                    for (j = 0; j < feature.geometry.coordinates.length; j++) {
                        point = feature.geometry.coordinates[j];
                        hash = point[0].toFixed(3).concat("|").concat(point[1].toFixed(3));
                        var increment = (j === 0 || j == feature.geometry.coordinates.length - 1) ? 1 : 2;

                        Intersections[hash] = Intersections[hash] == null ? increment : (Intersections[hash] + increment);

                        if (BorderCache[hash] == null)
                            BorderCache[hash] = feature.properties.region;
                        else if (BorderCache[hash] != feature.properties.region && feature.properties != null && feature.properties.region != null)
                            BorderCrossings[hash] = 1;

                        region = Paths.features[i].properties.region;
                        ownership = !(region in API.mapControl) ? "OFFLINE" : API.ownership(point[0], point[1], region).ownership;
                        JSONRoads._layers[road_keys[i]]._latlngs[j].ownership = ownership;

                        if (API.mapControl[feature.properties.region] != null && ownership != "OFFLINE" && region in API.mapControl)
                            all_features.push(point);

                        if (ownership != "OFFLINE" && ownership != "" && region in API.mapControl) {
                            var feature_set_original = ownership === "COLONIALS" ? colonial_features : warden_features;
                            var break_feature_set
                            if (j > 0 && last_ownership != ownership && ownership != "NONE") {
                                var feature_set = last_ownership === "COLONIALS" ? colonial_features : warden_features;
                                break_feature_set = feature_set.length > 0 && (last_point[0] != point[0] || last_point[1] != point[1]);
                            }
                            else
                                break_feature_set = false;

                            if (break_feature_set) {
                                // break the feature set, start a new one with this point

                                if (ownership == "WARDENS" && warden_features.length > 0) {
                                    WardenRoutes.features.push({ type: "Feature", properties: Paths.features[i].properties, geometry: { type: "LineString", coordinates: warden_features } });
                                    warden_features = [];
                                }

                                if (last_ownership == "COLONIALS" && colonial_features.length > 0) {
                                    ColonialRoutes.features.push({ type: "Feature", properties: Paths.features[i].properties, geometry: { type: "LineString", coordinates: colonial_features } });
                                    colonial_features = [];
                                }
                            }

                            if (ownership == "NONE") {
                                warden_features.push(point);
                                colonial_features.push(point);
                            }
                            else
                                feature_set_original.push(point);
                        }
                        last_point = point;
                        last_ownership = ownership;
                    }
                    if (warden_features.length > 1)
                        WardenRoutes.features.push({ type: "Feature", properties: Paths.features[i].properties, geometry: { type: "LineString", coordinates: warden_features } });
                    if (colonial_features.length > 1)
                        ColonialRoutes.features.push({ type: "Feature", properties: Paths.features[i].properties, geometry: { type: "LineString", coordinates: colonial_features } });
                    if (all_features.length > 1)
                        MainRoutes.features.push({ type: "Feature", properties: Paths.features[i].properties, geometry: { type: "LineString", coordinates: all_features } });
                }

                for (key in JSONRoads._layers) {
                    var layer = JSONRoads._layers[key];
                    for (i = 1; i < layer._latlngs.length; i++) {
                        region = layer.feature.properties.region;
                        var lat = layer._latlngs[i - 1].lat;
                        var lng = layer._latlngs[i - 1].lng;
                        var lat2 = layer._latlngs[i].lat;
                        var lng2 = layer._latlngs[i].lng;
                        var tier = layer.feature.properties.tier;
                        if (lat != null && lng != null && lat2 != null && lng2 != null) {
                            let control = layer._latlngs[i - 1].ownership;
                            ControlLayer.addRoad([[lat, lng], [lat2, lng2]], { control: control == "COLONIALS" ? 0 : (control == "WARDENS" ? 1 : (control == "OFFLINE" ? 2 : 3)), tier: tier });
                            SatelliteLayer.addRoad([[lat, lng], [lat2, lng2]], { control: control == "COLONIALS" ? 0 : (control == "WARDENS" ? 1 : (control == "OFFLINE" ? 2 : 3)), tier: tier });
                        }
                    }
                }

                ControlLayer.addTo(mymap);
                SatelliteLayer.addTo(mymap);

                var FoxholeRouter = {
                    renderer: L.canvas({tolerance: .2}).addTo(mymap),
                    summaryTemplate: '<table class="route-summary"><tr class="route-summary-header"><td><img src=\'images/{name}.webp\' /><span>{name}</span><span style=\'font-weight: bold; margin-left: 1em\' class=\'summary-routeinfo\'>{distance}</span>'
                        .concat('</td></tr>').concat('<tr class="detailed-routeinfo"><td colspan="2"><span class="slow"></span><span class="slidecontainer"><input type="range" min="d /1" max="100" value="50" class="slider" oninput="updateSlider(this)"></span><span class="fast"></span></td></tr>').concat('<tr><td class="no-click">{time}</td></tr></table>'),
                    API: API,
                    Roads: JSONRoads,

                    // layers
                    TownHalls: L.layerGroup(town_icons).addTo(mymap),
                    Safehouses: L.layerGroup(safehouse_icons).addTo(mymap),
                    MapControl: L.layerGroup().addTo(mymap),
                    MapCartographic: ControlLayer,
                    MapSatellite: SatelliteLayer,
                    VectorControlGrid: ControlLayer,
                    RoadQuality: L.layerGroup().addTo(mymap),
                    RoadControl: L.layerGroup().addTo(mymap),
                    Industry: L.layerGroup(industry_icons).addTo(mymap),
                    Resources: L.layerGroup(resource_icons).addTo(mymap),
                    // RegionLabels: RegionLabels,
                    Labels: L.layerGroup(labels).addTo(mymap),
                    Borders: L.layerGroup().addTo(mymap),

                    WardenNetworkLayer: L.layerGroup().addTo(mymap),
                    ColonialNetworkLayer: L.layerGroup().addTo(mymap),
                    NetworkLayer: L.layerGroup().addTo(mymap),

                    truckSpeed: 3600.0 / 50000.0 / .5, // 45 kmh (75% of 60kmh)
                    jeepSpeed: 3600.0 / 55000.0 / .5,
                    flatbedSpeed: 3600 / 25000.0 / .5,
                    htdSpeed: 3600 / 14500 / .90 / .65,

                    marker: null,
                    marker_shadow: null,

                    cardinalDirections: ['East', 'Northeast', 'North', 'Northwest', 'West', 'Southwest', 'South', 'Southeast'],

                    pathFinder: new PathFinder(MainRoutes, {
                        compact: null,
                        weightFn: function (a, b) { var dx = a[0] - b[0]; var dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
                    }),

                    wardenPathFinder: WardenRoutes != null && WardenRoutes.features != null && WardenRoutes.features.length > 0 ? new PathFinder(WardenRoutes, {
                        compact: null,
                        weightFn: function (a, b) { var dx = a[0] - b[0]; var dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
                    }) : null,

                    colonialPathFinder: ColonialRoutes != null && ColonialRoutes.features != null && ColonialRoutes.features.length > 0 ? new PathFinder(ColonialRoutes, {
                        compact: null,
                        weightFn: function (a, b) { var dx = a[0] - b[0]; var dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
                    }) : null,

                    scale_labels: function () {
                        scale_labels();
                    },

                    calculateAngle: function (v1, v2) {
                        var angle = Math.atan2(v2[1] - v1[1], v2[0] - v1[0]);
                        if (angle < 0)
                            angle += Math.PI * 2;
                        return angle;
                    },

                    setRoute: (route) => {FoxholeRouter.currentRoute = route;},

                    drawRouteLine: function (ctx) {
                        let cam = mymap.getPixelBounds();
                        let cx = cam.min.x;
                        let cy = cam.min.y;

                        if (this.Control.routeSelected != null) {
                            ctx.save();
                            var pixelScale = 2; // temporarily disabled: window.devicePixelRatio;
                            ctx.scale(pixelScale, pixelScale);
                            for (let style of [
                                { color: 'black', opacity: 0.15, weight: 9 },
                                { color: 'white', opacity: 0.8, weight: 6 },
                                { color: this.Control.routeSelected.name == "Shortest Route" ? "#9E3031" : "#5E9339", opacity: 1, weight: 2 }]) {

                                ctx.save();
                                ctx.beginPath();

                                if (style.color == "#9E3031" || style.color == "#5E9339")
                                    ctx.setLineDash([10, 10]);

                                ctx.lineCap = 'round';
                                ctx.strokeStyle = style.color;
                                ctx.lineWidth = style.weight;
                                ctx.opacity = style.opacity;
                                let first = true;
                                for (let coords of this.Control.routeSelected.coordinates) {
                                    let project_point = mymap.project(coords);
                                    if (first)
                                        ctx.moveTo(project_point.x - cx, project_point.y - cy);
                                    else
                                        ctx.lineTo(project_point.x - cx, project_point.y - cy);
                                    first = false;
                                }
                                ctx.stroke();
                                ctx.restore();
                            }

                            let sel_waypoints = this.Control.routeSelected.waypoints;
                            let marker_loaded = false;
                            let marker_shadow_loaded = false;

                            function drawMarkers(ctx) {
                                for (let m of sel_waypoints) {
                                    let p = mymap.project([m.latLng.lat, m.latLng.lng]);
                                    ctx.drawImage(marker_shadow, p.x - cx - marker.width / 2, p.y - cy - marker.height);
                                }
                                for (let m of sel_waypoints) {
                                    let p = mymap.project([m.latLng.lat, m.latLng.lng]);
                                    ctx.drawImage(marker, p.x - cx - marker.width / 2, p.y - cy - marker.height);
                                }
                                ctx.restore();
                            }

                            let marker = this.marker, marker_shadow = this.marker_shadow;
                            if (marker == null) {
                                this.marker = marker = new Image();
                                marker.src = "images/marker-icon.png";
                                marker.onload = function () {
                                    marker_loaded = true; if (marker_shadow_loaded && marker_loaded) drawMarkers(ctx);
                                }
                                this.marker_shadow = marker_shadow = new Image();
                                marker_shadow.src = "images/marker-shadow.png";
                                marker_shadow.onload = function () {
                                    marker_shadow_loaded = true; if (marker_shadow_loaded && marker_loaded) drawMarkers(ctx);
                                }
                                // set up the cache on this
                            }
                            else
                                setTimeout(() => drawMarkers(ctx), 0);

                        }
                    },

                    angleToDirection: function (angle) {
                        return FoxholeRouter.cardinalDirections[parseInt(Math.round((angle / (Math.PI * 2)) * 8)) % 8];
                    },

                    route: function (waypoints, callback, context) {
                        highlighter.clearLayers();
                        var path = null;
                        var wardenPath = null;
                        var colonialPath = null;
                        var no_warden_path = false;
                        var no_colonial_path = false;

                        // modify new waypoints to find closest ones
                        for (var i = 0; i < waypoints.length; i++) {
                            var closestPoint = null;
                            var distance = 0.0;
                            for (var key in FoxholeRouter.Roads._layers) {
                                var layer = FoxholeRouter.Roads._layers[key];
                                for (var j = 0; j < layer._latlngs.length; j++) {
                                    var lat = layer._latlngs[j].lat;
                                    var wplat = waypoints[i].latLng.lat;
                                    var lng = layer._latlngs[j].lng;
                                    var wplng = waypoints[i].latLng.lng;
                                    var distance_squared = (lat - wplat) * (lat - wplat) + (lng - wplng) * (lng - wplng);
                                    if (!closestPoint || distance_squared < distance) {
                                        distance = distance_squared;
                                        closestPoint = L.latLng(lat, lng);
                                    }
                                }
                            }
                            waypoints[i].latLng = closestPoint;
                        }

                        for (i = 0; i < waypoints.length - 1; i++) {
                            var start = waypoints[i].latLng;
                            var finish = waypoints[i + 1].latLng;
                            if (path == null)
                                path = FoxholeRouter.pathFinder.findPath(
                                    {
                                        name: "path",
                                        geometry: {coordinates: [start.lng, start.lat]}
                                    },
                                    {
                                        geometry: {coordinates: [finish.lng, finish.lat]}
                                    });

                            else {
                                var p = FoxholeRouter.pathFinder.findPath(
                                    {
                                        name: "path",
                                        geometry: {coordinates: [start.lng, start.lat]}
                                    },
                                    {
                                        geometry: {coordinates: [finish.lng, finish.lat]}
                                    });
                                if (p != null && p.path != null) {
                                    for (j = 0; j < p.path.length; j++)
                                        path.path.push(p.path[j]);
                                    path.weight += p.weight;
                                }
                            }

                            if (!no_warden_path && FoxholeRouter.wardenPathFinder != null) {
                                if (wardenPath == null)
                                    wardenPath = FoxholeRouter.wardenPathFinder.findPath(
                                        {
                                            name: "path",
                                            geometry: {coordinates: [start.lng, start.lat]}
                                        },
                                        {
                                            geometry: {coordinates: [finish.lng, finish.lat]}
                                        });
                                else {
                                    p = FoxholeRouter.wardenPathFinder.findPath(
                                        {
                                            name: "path",
                                            geometry: {coordinates: [start.lng, start.lat]}
                                        },
                                        {
                                            geometry: {coordinates: [finish.lng, finish.lat]}
                                        });
                                    if (p != null && p.path != null) {
                                        for (j = 0; j < p.path.length; j++)
                                            wardenPath.path.push(p.path[j]);
                                        wardenPath.weight += p.weight;
                                    }
                                    else
                                        wardenPath = null;
                                }
                            }
                            if (wardenPath == null)
                                no_warden_path = true;

                            if (!no_colonial_path && FoxholeRouter.colonialPathFinder != null) {
                                if (colonialPath == null)
                                    colonialPath = FoxholeRouter.colonialPathFinder.findPath(
                                        {
                                            name: "path",
                                            geometry: {coordinates: [start.lng, start.lat]}
                                        },
                                        {
                                            geometry: {coordinates: [finish.lng, finish.lat]}
                                        });
                                else {
                                    p = FoxholeRouter.colonialPathFinder.findPath(
                                        {
                                            name: "path",
                                            geometry: {coordinates: [start.lng, start.lat]}
                                        },
                                        {
                                            geometry: {coordinates: [finish.lng, finish.lat]}
                                        });
                                    if (p != null && p.path != null) {
                                        for (var k = 0; k < p.path.length; k++)
                                            colonialPath.path.push(p.path[k]);
                                        colonialPath.weight += p.weight;
                                    }
                                    else
                                        colonialPath = null;
                                }
                            }
                            if (colonialPath == null)
                                no_colonial_path = true;

                        }

                        if (no_colonial_path)
                            colonialPath = null;

                        if (no_warden_path)
                            wardenPath = null;

                        let call = callback.bind(context);
                        var route_builder = function (name, opath, wp) {
                            var coordinates = [];
                            var instructions = [];
                            var accumulated_distance = 0.0;
                            var crossroads = [];
                            var last_region = null;
                            for (var i = 0; i < opath.path.length; i++) {
                                coordinates[i] = L.latLng(opath.path[i][1], opath.path[i][0]);
                                if (i > 0) {
                                    var dy = opath.path[i][0] - opath.path[i - 1][0];
                                    var dx = opath.path[i][1] - opath.path[i - 1][1];

                                    var distance = (Math.sqrt(dx * dx + dy * dy) / 256.0) * 12012.0;
                                    var hash = opath.path[i][0].toFixed(3).concat("|").concat(opath.path[i][1].toFixed(3));
                                    var lastHash = opath.path[i - 1][0].toFixed(3).concat("|").concat(opath.path[i - 1][1].toFixed(3));
                                    var borderStart = BorderCrossings[lastHash] === 1;
                                    var intersection = Intersections[hash] > 2 || i == 1 || i == opath.path.length - 1;

                                    if (intersection || borderStart) { /* if this is an intersection or border */
                                        var region = opath.path[i][2];
                                        crossroads.push({
                                            angleIn: FoxholeRouter.calculateAngle(opath.path[i - 1], opath.path[i]),
                                            angleOut: i < opath.path.length - 1 ? FoxholeRouter.calculateAngle(opath.path[i], opath.path[i + 1]) : null,
                                            coordinates: [opath.path[i - 1], opath.path[i]],
                                            distanceFromLast: accumulated_distance + distance,
                                            region: region,
                                            border: borderStart,
                                            regionChange: region != last_region
                                        });
                                        accumulated_distance = 0;
                                    }
                                    else
                                        accumulated_distance += distance;
                                    last_region = region;
                                }
                            }

                            var turns = {
                                0: 'Continue',
                                1: 'Veer left',
                                2: 'Turn left',
                                3: 'Sharp turn left',
                                4: 'About turn',
                                5: 'Sharp turn right',
                                6: 'Turn right',
                                7: 'Veer right',
                                "-1": 'Veer right',
                                "-2": 'Turn right',
                                "-3": 'Sharp turn right',
                                "-4": 'About turn',
                                "-5": 'Sharp turn left',
                                "-6": 'Turn left',
                                "-7": 'Veer left'
                            };

                            for (i = 0; i < crossroads.length - 1; i++) {
                                {
                                    var direction = FoxholeRouter.angleToDirection(crossroads[i].angleOut);
                                    var angleIn = parseInt(Math.round((crossroads[i].angleIn / (Math.PI * 2)) * 8)) % 8;
                                    var angleOut = parseInt(Math.round((crossroads[i].angleOut / (Math.PI * 2)) * 8)) % 8;
                                    var border = i < crossroads.length - 1 && (i < crossroads.length - 1 && crossroads[i + 1].border) ? 1 : 0;
                                    var region_change = i == 0 || crossroads[i].regionChange;
                                    var turnicon = turns[angleOut - angleIn];
                                    var text
                                    if (angleIn == angleOut)
                                        text = "Continue ".concat(direction).concat(" ").concat(i < crossroads.length - 1 ? crossroads[i + 1].distanceFromLast.toFixed().toString().concat(" meters") : '');
                                    else {
                                        text = turns[angleOut - angleIn].concat(' and drive ').concat(direction).concat(' for ').concat(crossroads[i + 1].distanceFromLast.toFixed().toString()).concat(" meters");
                                    }
                                    instructions.push({
                                        distance: crossroads[i + 1].distanceFromLast,
                                        time: 0,
                                        text: crossroads[i].region.concat('|').concat(text).concat('|').concat(border.toString()).concat('|').concat(region_change ? '1' : '0').concat('|').concat(turnicon).concat('|').concat(crossroads[i].tier)
                                    });
                                }
                            }
                            instructions.push({
                                distance: 0,
                                time: 0,
                                text: crossroads[crossroads.length - 1].region.concat("|").concat("You have arrived at your destination.|0|0|0|")
                            });

                            distance = (opath.weight / 256.0) * 12012.0; //map scale 

                            let sums = [0, 0, 0];
                            for (let i = 0; i < opath.path.length - 1; i++)
                                sums[(opath.path[i][3] - 1) % 3] += Math.sqrt(Math.pow(opath.path[i + 1][0] - opath.path[i][0], 2) + Math.pow(opath.path[i + 1][1] - opath.path[i][1], 2));

                            let sumSum = sums[0] + sums[1] + sums[2];

                            return {
                                name: name,
                                summary:
                                {
                                    totalTime: distance,
                                    totalDistance: {
                                        distance: distance,
                                        breakdown: [sums[0] / sumSum, sums[1] / sumSum, sums[2] / sumSum]
                                    }
                                },
                                inputWaypoints: wp,
                                waypoints: wp,
                                instructions: instructions,
                                coordinates: coordinates
                            }
                        };

                        if (path === null)
                            call({ status: -1, message: "Could not find a route" }, []);
                        else {
                            var routes
                            if (path != null && (
                                (wardenPath != null && wardenPath.path.length == path.path.length && wardenPath.path.reduce(function (result, value, index, array) { if (!result) return false; return path.path[index][0] == wardenPath.path[index][0] && path.path[index][1] == wardenPath.path[index][1]; }))
                                ||
                                (colonialPath != null && colonialPath.path.length == path.path.length && colonialPath.path.reduce(function (result, value, index, array) { if (!result) return false; return path.path[index][0] == colonialPath.path[index][0] && path.path[index][1] == colonialPath.path[index][1]; }))
                            )
                            )
                                routes = [];
                            else
                                routes = [route_builder("shortest-route", path, waypoints)];

                            if (wardenPath != null)
                                routes.unshift(route_builder("warden-route", wardenPath, waypoints));
                            if (colonialPath != null)
                                routes.unshift(route_builder("colonial-route", colonialPath, waypoints));

                            call(null, routes);
                        }
                    },

                    showControl: function () {
                        ControlLayer.draw = true;
                        ControlLayer.redraw();
                        SatelliteLayer.draw = true;
                        SatelliteLayer.redraw();
                    },

                    hideControl: function () {
                        ControlLayer.draw = false;
                        ControlLayer.redraw();
                        SatelliteLayer.draw = false;
                        SatelliteLayer.redraw();
                    },

                    showRoadQuality: function () {
                        ControlLayer.quality = true;
                        ControlLayer.redraw();
                        SatelliteLayer.quality = true;
                        SatelliteLayer.redraw();
                    },

                    hideRoadQuality: function () {
                        ControlLayer.quality = false;
                        ControlLayer.redraw();
                        SatelliteLayer.quality = false;
                        SatelliteLayer.redraw();
                    },

                    showRoadControl: function () {
                        ControlLayer.controls[0] = true;
                        ControlLayer.controls[1] = true;
                        ControlLayer.controls[2] = true;
                        ControlLayer.controls[3] = true;
                        ControlLayer.redraw();
                        SatelliteLayer.controls[0] = true;
                        SatelliteLayer.controls[1] = true;
                        SatelliteLayer.controls[2] = true;
                        SatelliteLayer.controls[3] = true;
                        SatelliteLayer.redraw();
                    },

                    hideRoadControl: function () {
                        ControlLayer.controls[0] = false;
                        ControlLayer.controls[1] = false;
                        ControlLayer.controls[2] = false;
                        ControlLayer.controls[3] = false;
                        ControlLayer.redraw();
                        SatelliteLayer.controls[0] = false;
                        SatelliteLayer.controls[1] = false;
                        SatelliteLayer.controls[2] = false;
                        SatelliteLayer.controls[3] = false;
                        SatelliteLayer.redraw();
                    },

                    showLabels: function () {
                        scale_labels();
                    },

                    showBorders: function () {
                        ControlLayer.drawHexes = true;
                        ControlLayer.redraw();
                        SatelliteLayer.drawHexes = true;
                        SatelliteLayer.redraw();
                    },

                    hideBorders: function () {
                        ControlLayer.drawHexes = false;
                        ControlLayer.redraw();
                        SatelliteLayer.drawHexes = false;
                        SatelliteLayer.redraw();
                    }
                };

                return FoxholeRouter;
            }
        };
    });
