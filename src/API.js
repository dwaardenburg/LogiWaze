const pip = require('point-in-polygon');
const kriging = require('@sakitam-gis/kriging');
const superagent = require('superagent');

var height = 256 / 7;
var width = height * 2 / Math.sqrt(3);
var halfwidth = width * .5;
var halfheight = height * .5;

let regionPolygon = [[halfwidth * .5, halfheight], [halfwidth, 0], [halfwidth * .5, -halfheight], [-halfwidth * .5, -halfheight], [-halfwidth, 0], [-halfwidth * .5, halfheight]];
let ox = 0;
let oy = 0;
let regions = [
    { name: "NevishLineHex", realName: "Nevish Line", y: oy + 1.5 * height, x: ox - 2.25 * width },
    { name: "AcrithiaHex", realName: "Acrithia", y: oy - 2.5 * height, x: ox + .75 * width },
    { name: "RedRiverHex", realName: "Red River", y: oy - 2.5 * height, x: ox - .75 * width },
    { name: "CallumsCapeHex", realName: "Callum's Cape", y: oy + 2 * height, x: ox - 1.5 * width },
    { name: "SpeakingWoodsHex", realName: "Speaking Woods", y: oy + 2.5 * height, x: ox - .75 * width },
    { name: "BasinSionnachHex", realName: "Basin Sionnach", y: oy + 3 * height, x: ox },
    { name: "HowlCountyHex", realName: "Howl County", y: oy + 2.5 * height, x: ox + .75 * width },
    { name: "ClansheadValleyHex", realName: "Clanshead Valley", y: oy + 2 * height, x: ox + 1.5 * width },
    { name: "MorgensCrossingHex", realName: "Morgen's Crossing", y: oy + 1.5 * height, x: ox + 2.25 * width },
    { name: "TheFingersHex", realName: "The Fingers", y: oy - 1.5 * height, x: ox + 2.25 * width },
    { name: "TerminusHex", realName: "Terminus", y: oy - 2 * height, x: ox + 1.5 * width },
    { name: "KalokaiHex", realName: "Kalokai", y: oy - 3 * height, x: ox },
    { name: "AshFieldsHex", realName: "Ash Fields", y: oy - 2 * height, x: ox - 1.5 * width },
    { name: "OriginHex", realName: "Origin", y: oy - 1.5 * height, x: ox - 2.25 * width },
    { name: "GodcroftsHex", realName: "Godcrofts", y: .5 * height + oy, x: 2.25 * width + ox },
    { name: "DeadLandsHex", realName: "Deadlands", y: oy, x: ox },
    { name: "ReachingTrailHex", realName: "Reaching Trail", y: oy + 2 * height, x: ox },
    { name: "CallahansPassageHex", realName: "Callahan's Passage", y: oy + height, x: ox },
    { name: "MarbanHollow", realName: "Marban Hollow", y: oy + .5 * height, x: ox + .75 * width },
    { name: "UmbralWildwoodHex", realName: "Umbral Wildwood", y: oy - height, x: ox },
    { name: "HeartlandsHex", realName: "Heartlands", y: oy - 1.5 * height, x: ox - .75 * width },
    { name: "LochMorHex", realName: "Loch Mor", y: oy - .5 * height, x: ox - .75 * width },
    { name: "LinnMercyHex", realName: "Linn of Mercy", y: oy + .5 * height, x: ox - .75 * width },
    { name: "StonecradleHex", realName: "Stonecradle", y: oy + height, x: ox - 1.5 * width },
    { name: "FarranacCoastHex", realName: "Farranac Coast", y: oy, x: ox - 1.5 * width },
    { name: "WestgateHex", realName: "Westgate", y: oy - height, x: ox - 1.5 * width },
    { name: "FishermansRowHex", realName: "Fisherman's Row", y: oy - .5 * height, x: ox - 2.25 * width },
    { name: "OarbreakerHex", realName: "Oarbreaker", y: oy + .5 * height, x: ox - 2.25 * width },
    { name: "GreatMarchHex", realName: "The Great March", y: oy - 2 * height, x: ox },
    { name: "TempestIslandHex", realName: "Tempest Island", y: oy - .5 * height, x: ox + 2.25 * width },
    { name: "EndlessShoreHex", realName: "Endless Shore", y: oy, x: ox + 1.5 * width },
    { name: "AllodsBightHex", realName: "Allods Bight", y: oy - height, x: ox + 1.5 * width },
    { name: "WeatheredExpanseHex", realName: "Weathered Expanse", y: oy + height, x: ox + 1.5 * width },
    { name: "DrownedValeHex", realName: "Drowned Vale", y: oy - .5 * height, x: ox + .75 * width },
    { name: "ShackledChasmHex", realName: "Shackled Chasm", y: oy - 1.5 * height, x: ox + .75 * width },
    { name: "ViperPitHex", realName: "Viper Pit", y: oy + 1.5 * height, x: ox + .75 * width },
    { name: "MooringCountyHex", realName: "Mooring County", y: oy + 1.5 * height, x: ox - .75 * width }
];

let regionNameMap = [];
for (var i = 0; i < regions.length; i++)
    regionNameMap[regions[i].name] = regions[i].realName;

function APIQuery(URL, success) {
    superagent.get(URL).then(res => {
        success(res.body);
    }).catch(error => { console.log(error); alert("War API cannot be contacted right now: ".concat(error)); });
}

exports.API = {
    regions: regions,
    mapControl: {},
    resources: {},
    townHallIcons : [35, 5, 6, 7, 8, 9, 10, 45, 46, 47, 29, 17, 34, 51, 39, 52, 33, 18, 19, 56, 57, 58],
    krigingControlPointIcons: [5, 6, 7, 8, 9, 10, 45, 46, 47, 29, 56, 57, 58],

    mapRegionName: function (x) {
        return regionNameMap[x];
    },

    calculateRegion: function (x, y) {
        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];

            if (pip([x - region.x - 128, - region.y + y + 128], regionPolygon))
                return region.name;
        }
        return null;
    },

    remapXY: function (hex_name) {
        var h = 256 / 7;
        var w = h * 2 / Math.sqrt(3);
        if (hex_name == "DeadLandsHex") return { x: 0, y: 0 };
        if (hex_name == "CallahansPassageHex") return { x: 0, y: h };
        if (hex_name == "MarbanHollow") return { x: 0.75 * w, y: 0.5 * h };
        if (hex_name == "UmbralWildwoodHex") return { x: 0, y: -h };
        if (hex_name == "MooringCountyHex") return { x: -0.75 * w, y: 1.5 * h };
        if (hex_name == "HeartlandsHex") return { x: -0.75 * w, y: - 1.5 * h };
        if (hex_name == "LochMorHex") return { x: -0.75 * w, y: -0.5 * h };
        if (hex_name == "LinnMercyHex") return { x: -0.75 * w, y: 0.5 * h };
        if (hex_name == "ReachingTrailHex") return { x: 0, y: 2 * h };
        if (hex_name == "StonecradleHex") return { x: -1.5 * w, y: h };
        if (hex_name == "FarranacCoastHex") return { x: -1.5 * w, y: 0 };
        if (hex_name == "WestgateHex") return { x: -1.5 * w, y: -h };
        if (hex_name == "FishermansRowHex") return { x: -2.25 * w, y: -0.5 * h };
        if (hex_name == "OarbreakerHex") return { x: -2.25 * w, y: 0.5 * h };
        if (hex_name == "GreatMarchHex") return { x: 0, y: -2 * h };
        if (hex_name == "TempestIslandHex") return { x: 2.25 * w, y: -0.5 * h };
        if (hex_name == "GodcroftsHex") return { x: 2.25 * w, y: 0.5 * h };
        if (hex_name == "EndlessShoreHex") return { x: 1.5 * w, y: 0 };
        if (hex_name == "AllodsBightHex") return { x: 1.5 * w, y: -h };
        if (hex_name == "WeatheredExpanseHex") return { x: 1.5 * w, y: h };
        if (hex_name == "DrownedValeHex") return { x: 0.75 * w, y: -0.5 * h };
        if (hex_name == "ShackledChasmHex") return { x: 0.75 * w, y: -1.5 * h };
        if (hex_name == "ViperPitHex") return { x: 0.75 * w, y: 1.5 * h };
        if (hex_name == "NevishLineHex") return { x: -2.25 * w, y: 1.5 * h };
        if (hex_name == "AcrithiaHex") return { x: 0.75 * w, y: -2.5 * h };
        if (hex_name == "RedRiverHex") return { x: -0.75 * w, y: -2.5 * h };
        if (hex_name == "CallumsCapeHex") return { x: -1.5 * w, y: 2 * h };
        if (hex_name == "SpeakingWoodsHex") return { x: -0.75 * w, y: 2.5 * h };
        if (hex_name == "BasinSionnachHex") return { x: 0, y: 3 * h };
        if (hex_name == "HowlCountyHex") return { x: 0.75 * w, y: 2.5 * h };
        if (hex_name == "ClansheadValleyHex") return { x: 1.5 * w, y: 2 * h };
        if (hex_name == "MorgensCrossingHex") return { x: 2.25 * w, y: 1.5 * h };
        if (hex_name == "TheFingersHex") return { x: 2.25 * w, y: -1.5 * h };
        if (hex_name == "TerminusHex") return { x: 1.5 * w, y: -2 * h };
        if (hex_name == "KalokaiHex") return { x: 0, y: -3 * h };
        if (hex_name == "AshFieldsHex") return { x: -1.5 * w, y: -2 * h };
        if (hex_name == "OriginHex") return { x: -2.25 * w, y: -1.5 * h };

        return { x: 0, y: 0 };
    },

    ownership: function (x, y, region) {
        if (!(region in exports.API.mapControl))
            return "OFFLINE";

            x -= 128;
            y += 128;

        var u = exports.API.mapControl[region];
        var distanceSquared = -1;
        var icon = -1;
        var keys = Object.keys(u);
        for (let key of keys) {
            var j = u[key];
            if (j.town) {
                var px = j.x;
                var py = j.y;
                var distanceCalculation = (x - px) * (x - px) + (y - py) * (y - py);
                if (distanceSquared < 0 || distanceCalculation < distanceSquared) {
                    icon = j.mapIcon;
                    distanceSquared = distanceCalculation;
                }
            }
        }

        var c = kriging.predict(x, y, exports.API.variogram);
        return { ownership: c < -.25 ? "WARDENS" : (c > .25 ? "COLONIALS" : "NONE"), icon: icon };
    },

    control: (x, y) => {
        return kriging.predict(x - 128, y + 128, exports.API.variogram)
    },

    update: function (completionCallback, shard) {

        if (shard == null)
            shard = 'war-service-live';
        else
            shard = 'war-service-'.concat(shard);

        APIQuery("https://".concat(shard).concat(".foxholeservices.com/api/worldconquest/war"),
            function (war) {
                exports.API.war = war;
                APIQuery("https://".concat(shard).concat(".foxholeservices.com/api/worldconquest/maps"),
                    function (maps) {
                        // iterate here on the maps and collect status
                        var complete = maps.length;
                        var p_x = [], p_y = [], p_t = [];

                        var yf = 256 / 7;
                        var xf = yf * 2 / Math.sqrt(3);

                        for (var i = 0; i < maps.length; i++) {
                            const mapName = maps[i];
                            APIQuery("https://".concat(shard).concat(".foxholeservices.com/api/worldconquest/maps/").concat(maps[i]).concat("/dynamic/public"),
                                function (mapData) {
                                    if (mapData.mapItems.length > 0) {
                                        exports.API.mapControl[mapName] = {};
                                        exports.API.resources[mapName] = {};
                                        var offset = exports.API.remapXY(mapName);
                                        for (var j = 0; j < mapData.mapItems.length; j++) {
                                            var icon = mapData.mapItems[j].iconType;
                                            if (exports.API.townHallIcons.includes(icon)) {
                                                var x = mapData.mapItems[j].x;
                                                var y = mapData.mapItems[j].y;
                                                x = (((x * xf) + offset.x) - xf * .5);
                                                y = ((((1 - y) * yf) + offset.y) - yf * .5);
                                                var key = x.toFixed(3).toString().concat('|').concat(y.toFixed(3).toString());
                                                var control = mapData.mapItems[j].teamId;
                                                exports.API.mapControl[mapName][key] = {
                                                    x: x,
                                                    y: y,
                                                    control: control,
                                                    mapIcon: icon,
                                                    nuked: (mapData.mapItems[j].flags & 0x10) != 0,
                                                    town: exports.API.krigingControlPointIcons.includes(icon)
                                                };
                                                if ((mapData.mapItems[j].flags & 0x10) == 0 && control != "OFFLINE" && exports.API.krigingControlPointIcons.includes(icon)) {
                                                    p_x.push(x);
                                                    p_y.push(y);
                                                    p_t.push(control == "WARDENS" ? -1 : (control == "COLONIALS" ? 1 : 0));
                                                }
                                            }
                                            else {
                                                x = (((mapData.mapItems[j].x * xf) + offset.x) - xf * .5);
                                                y = ((((1 - mapData.mapItems[j].y) * yf) + offset.y) - yf * .5);
                                                key = x.toFixed(3).toString().concat('|').concat(y.toFixed(3).toString());
                                                exports.API.resources[mapName][key] = {
                                                    x: x,
                                                    y: y,
                                                    control: mapData.mapItems[j].teamId,
                                                    mapIcon: icon,
                                                    nuked: (mapData.mapItems[j].flags & 0x10) != 0
                                                };
                                            }
                                        }

                                    }

                                    if (--complete == 0) {
                                        exports.API.variogram = kriging.train(p_t, p_x, p_y, 'exponential', 0, 100);
                                        completionCallback();
                                    }
                                });
                        }
                    });
            });
    }
};

