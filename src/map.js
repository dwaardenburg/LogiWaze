define(['leaflet', 'intersects'],
    function (L, intersects) {
        var VectorControlGridPrototype = L.GridLayer.extend({
            controls: [true, true, true, true],
            quality: true,
            draw: true,
            drawHexes: true,
            zoomScale: function (zoom) {return .65 * (1 + this.maxZoom - zoom);},
            pixelScale: 1,
            build: "",

            createTile: function (coords, done) {
                let scale = Math.pow(2, coords.z);
                if (coords.x < 0 || coords.x >= scale || coords.y < 0 || coords.y >= scale || coords.z < 0) {
                    let tile = L.DomUtil.create('canvas', 'leaflet-tile');
                    let tile_size = this.getTileSize();
                    tile.width = this.pixelScale * tile_size.x;
                    tile.height = this.pixelScale * tile_size.y;
                    setTimeout(() => done(null, tile), 0);
                    return tile;
                }
                return this.renderer({gridLayer: this, coords: coords, done: done}, 1);
            },

            renderer: function (renderElements, phase) {
                switch (phase) {
                    case 1:
                        {
                            renderElements.tile = L.DomUtil.create('canvas', 'leaflet-tile');
                            let size = renderElements.gridLayer.getTileSize();
                            renderElements.tile.width = size.x * renderElements.gridLayer.pixelScale;
                            renderElements.tile.height = size.y * renderElements.gridLayer.pixelScale;
                            renderElements.tile.style.width = renderElements.tile.width.toString().concat('px');
                            renderElements.tile.style.height = renderElements.tile.height.toString().concat('px');
                            renderElements.ctx = renderElements.tile.getContext('2d');
                            renderElements.img = new Image();
                            var scale = Math.pow(2, Math.max(0, renderElements.coords.z - renderElements.gridLayer.max_native_zoom));
                            renderElements.img.src = 'images/tiles/'.concat(Math.min(renderElements.coords.z, renderElements.gridLayer.max_native_zoom)).concat('_').concat(Math.floor(renderElements.coords.x / scale)).concat('_').concat(Math.floor(renderElements.coords.y / scale)).concat('.webp');
                            renderElements.phase_2_complete = false;
                            renderElements.phase_3_complete = false;
                            renderElements.img.onload = () => renderElements.gridLayer.yield(renderElements, 2);
                            renderElements.gridLayer.yield(renderElements, 3);
                            return renderElements.tile;
                        }
                    case 2:
                        {
                            scale = Math.pow(2, Math.max(0, renderElements.coords.z - renderElements.gridLayer.max_native_zoom));
                            var ox = renderElements.coords.x % scale;
                            var oy = renderElements.coords.y % scale;
                            var bx = (renderElements.img.width / scale);
                            var by = (renderElements.img.height / scale);
                            renderElements.ctx.drawImage(renderElements.img, bx * ox, by * oy, bx, by, 0, 0, renderElements.tile.width, renderElements.tile.height);
                            delete renderElements.img;
                            renderElements.phase_2_complete = true;
                            if (renderElements.phase_3_complete)
                                renderElements.gridLayer.yield(renderElements, 4);
                            break;
                        }
                    case 3:
                        {
                            renderElements.hd_ratio = (renderElements.coords.z < 2 ? 8 : 16);
                            if (!renderElements.gridLayer.draw) {
                                renderElements.phase_3_complete = true;
                                if(renderElements.phase_2_complete)
                                    renderElements.gridLayer.yield(renderElements, 4);
                                return;
                            }
                            renderElements.temp_canvas = L.DomUtil.create('canvas', '');
                            renderElements.temp_canvas.width = 2 + renderElements.tile.width / renderElements.gridLayer.pixelScale / renderElements.hd_ratio;
                            renderElements.temp_canvas.height = 2 + renderElements.tile.height / renderElements.gridLayer.pixelScale / renderElements.hd_ratio;
                            renderElements.temp_ctx = renderElements.temp_canvas.getContext('2d', { alpha: false });
                            renderElements.x = 0;
                            renderElements.y = 0;
                            renderElements.i = 0;
                            renderElements.d = renderElements.temp_ctx.getImageData(0, 0, renderElements.temp_canvas.width, renderElements.temp_canvas.height);
                            renderElements.gridLayer.calculateControl(renderElements);
                            break;
                        }
                    case 4:
                        {
                            if (renderElements.temp_canvas != null) {
                                let overlay = document.createElement("canvas");
                                overlay.width = renderElements.tile.width;
                                overlay.height = renderElements.tile.height;

                                let overlay_ctx = overlay.getContext('2d');

                                overlay_ctx.save();
                                renderElements.gridLayer.drawValidRegions(overlay, overlay_ctx, renderElements.coords, renderElements.gridLayer);
                                overlay_ctx.restore();

                                overlay_ctx.save();
                                overlay_ctx.globalCompositeOperation = 'source-atop';
                                overlay_ctx.imageSmoothingQuality = 'low';
                                overlay_ctx.drawImage(renderElements.temp_canvas, 1, 1, renderElements.temp_canvas.width - 2, renderElements.temp_canvas.height - 2, 0, 0, renderElements.tile.width, renderElements.tile.height);
                                overlay_ctx.restore();

                                overlay_ctx.save();
                                overlay_ctx.scale(renderElements.gridLayer.pixelScale, renderElements.gridLayer.pixelScale);
                                renderElements.gridLayer.drawInvalidRegions(overlay, overlay_ctx, renderElements.coords, renderElements.gridLayer);
                                overlay_ctx.restore();

                                renderElements.ctx.save();
                                renderElements.ctx.globalCompositeOperation = 'source-atop';
                                renderElements.ctx.globalAlpha = .3;
                                renderElements.ctx.drawImage(overlay, 0, 0);
                                renderElements.ctx.restore();

                                delete renderElements.temp_canvas;
                            }
                            renderElements.gridLayer.yield(renderElements, 5);
                            break;
                        }
                    case 5:
                        {
                            renderElements.ctx.save();
                            renderElements.ctx.scale(renderElements.gridLayer.pixelScale, renderElements.gridLayer.pixelScale);
                            renderElements.gridLayer.drawRoads(renderElements);
                            break;
                        }
                    case 6:
                        {
                            renderElements.ctx.restore();
                            renderElements.gridLayer.drawBorders(renderElements);
                            renderElements.gridLayer.yield(renderElements, 7);
                            break;
                        }
                    case 7:
                        {
                            renderElements.ctx.restore();
                            setTimeout(() => renderElements.done(null, renderElements.tile), 0);
                            break;
                        }
                }
            },

            yield: (renderElements, phase) => setTimeout(() => renderElements.gridLayer.renderer(renderElements, phase), 0),

            drawHex: (ctx, x, y, w, h, scale) => {
                ctx.lineWidth = scale;
                ctx.beginPath();
                ctx.moveTo(x + w, y);
                ctx.lineTo(x + w * .5, y + h);
                ctx.lineTo(x - w * .5, y + h);
                ctx.lineTo(x - w, y);
                ctx.lineTo(x - .5 * w, y - h);
                ctx.lineTo(x + .5 * w, y - h);
                ctx.lineTo(x + w, y);
                ctx.stroke();
            },

            fillHex: (ctx, x, y, w, h) => {
                ctx.beginPath();
                ctx.moveTo(x + w, y);
                ctx.lineTo(x + w * .5, y + h);
                ctx.lineTo(x - w * .5, y + h);
                ctx.lineTo(x - w, y);
                ctx.lineTo(x - .5 * w, y - h);
                ctx.lineTo(x + .5 * w, y - h);
                ctx.lineTo(x + w, y);
                ctx.fill();
                ctx.stroke();
            },

            drawBorders: function (renderElements) {
                let coords = renderElements.coords;

                let tile = renderElements.tile;

                if (!renderElements.gridLayer.drawHexes)
                    return tile;

                var zoom = Math.pow(2, coords.z);
                var lineWidth = .05 * Math.pow(2, coords.z);
                var shadow = lineWidth * .5 / Math.pow(2, renderElements.gridLayer.maxZoom);

                renderElements.ctx.save();
                renderElements.ctx.strokeStyle = '#303030';
                renderElements.ctx.opacity = .8;
                renderElements.ctx.scale(renderElements.gridLayer.pixelScale, renderElements.gridLayer.pixelScale);
                for (var source of renderElements.gridLayer.hex_sources) {
                    var label_w = source.size.width * zoom + shadow * 2;
                    var label_h = source.size.height * zoom + shadow * 2;
                    var label_x = source.x * zoom - coords.x * tile.width / renderElements.gridLayer.pixelScale - label_w - shadow;
                    var label_y = source.y * zoom - coords.y * tile.height / renderElements.gridLayer.pixelScale - label_h - shadow;

                    if (intersects.boxBox(0, 0, tile.width, tile.height, label_x, label_y, label_w, label_h))
                        renderElements.gridLayer.drawHex(renderElements.ctx, label_x + label_w * .5, label_y + label_h * .5, label_w * .5, label_h * .5, lineWidth);
                }
                renderElements.ctx.restore();
            },

            drawValidRegions: function (tile, ctx, coords, gridLayer) {
                var zoom = Math.pow(2, coords.z);
                var lineWidth = 1 * Math.pow(2, coords.z);
                var shadow = lineWidth * .5 / Math.pow(2, gridLayer.maxZoom);
                ctx.save();
                ctx.fillStyle = '#FFFFFFFF';
                ctx.strokeStyle = '#FFFFFFFF';
                ctx.scale(gridLayer.pixelScale, gridLayer.pixelScale);
                for (var source of gridLayer.hex_sources) {
                    if (!source.offline) {
                        var label_w = source.size.width * zoom + shadow * 2;
                        var label_h = source.size.height * zoom + shadow * 2;
                        var label_x = source.x * zoom - coords.x * tile.width / gridLayer.pixelScale - label_w - shadow;
                        var label_y = source.y * zoom - coords.y * tile.height / gridLayer.pixelScale - label_h - shadow;
                        if (intersects.boxBox(0, 0, tile.width, tile.height, label_x, label_y, label_w, label_h))
                            gridLayer.fillHex(ctx, label_x + label_w * .5, label_y + label_h * .5, label_w * .5, label_h * .5);
                    }
                }
                ctx.restore();
            },

            drawInvalidRegions: function (tile, ctx, coords, gridLayer) {
                var zoom = Math.pow(2, coords.z);
                var lineWidth = 1 * Math.pow(2, coords.z);
                var shadow = lineWidth * .5 / Math.pow(2, gridLayer.maxZoom);
                ctx.save();
                ctx.fillStyle = '#000000FF';
                ctx.strokeStyle = '#000000FF';
                for (var source of gridLayer.hex_sources)
                    if (source.offline) {
                        var label_w = source.size.width * zoom + shadow * 2;
                        var label_h = source.size.height * zoom + shadow * 2;
                        var label_x = source.x * zoom - coords.x * tile.width / gridLayer.pixelScale - label_w - shadow;// / gridLayer.pixelScale
                        var label_y = source.y * zoom - coords.y * tile.height / gridLayer.pixelScale - label_h - shadow;
                        if (intersects.boxBox(0, 0, tile.width, tile.height, label_x, label_y, label_w, label_h))
                            gridLayer.fillHex(ctx, label_x + label_w * .5, label_y + label_h * .5, label_w * .5, label_h * .5);
                    }
                ctx.restore();
            },

            drawRoads: function (renderElements) {
                var coords = renderElements.coords;
                let tile = renderElements.tile;
                let ctx = renderElements.ctx;

                ctx.lineJoin = 'miter';
                ctx.lineCap = 'round';

                var scale = Math.pow(2, renderElements.gridLayer.grid_depth - coords.z);
                var start_x = Math.floor(coords.x * scale);
                var start_y = Math.floor(coords.y * scale);

                var end_x = Math.ceil((coords.x + 1) * scale);
                var end_y = Math.ceil((coords.y + 1) * scale);

                var depth_inverse = Math.pow(2, coords.z);
                var sources = renderElements.gridLayer.road_sources;
                var offset = renderElements.gridLayer.offset;
                var outerWidth = renderElements.gridLayer.RoadWidth * depth_inverse;
                var innerWidth = renderElements.gridLayer.ControlWidth * depth_inverse;
                var grid_x_size = renderElements.gridLayer.grid_x_size;
                var grid_y_size = renderElements.gridLayer.grid_y_size;
                var controls = renderElements.gridLayer.controls;
                var quality = renderElements.gridLayer.quality;
                let pixelScale = renderElements.gridLayer.pixelScale;
                function draw(i, start_x, start_y, end_x, end_y, x, y, step) {
                    var startTime = Date.now();
                    if (step == 1) {
                        if (quality) {
                            var tiers = ['', '#957458', '#94954e', '#5a9565'];
                            ctx.lineWidth = outerWidth;
                            for (; y < end_y; y++, x = start_x)
                                for (; x < end_x; x++, i = 0) {

                                    if (x >= 0 && y >= 0 && x < grid_x_size && y < grid_y_size) {
                                        for (; i < sources[x][y].length; i++) {

                                            var source = sources[x][y][i];
                                            ctx.strokeStyle = tiers[source.options.tier];
                                            ctx.beginPath();
                                            var coordsx = coords.x * tile.width / pixelScale;
                                            var coordsy = coords.y * tile.height / pixelScale;
                                            var x1 = (source.points[0][1] + offset[0]) * depth_inverse - coordsx;
                                            var y1 = (source.points[0][0] + offset[1]) * depth_inverse - coordsy;
                                            var x2 = (source.points[1][1] + offset[0]) * depth_inverse - coordsx;
                                            var y2 = (source.points[1][0] + offset[1]) * depth_inverse - coordsy;
                                            ctx.moveTo(x1, y1);
                                            ctx.lineTo(x2, y2);
                                            ctx.stroke();
                                            if (Date.now() - startTime > 3) {
                                                setTimeout(() => draw(i, start_x, start_y, end_x, end_y, x, y, step), 0);
                                                return;
                                            }
                                        }
                                    }
                                    if (Date.now() - startTime > 3) {
                                        setTimeout(() => draw(i, start_x, start_y, end_x, end_y, x, y, step), 0);
                                        return;
                                    }
                                }

                        }
                        // move to step 2, reset all starting values (only once)
                        step = 2;
                        x = start_x;
                        y = start_y;
                        i = 0;
                    }

                    if (step == 2) {
                        ctx.lineWidth = innerWidth;
                        var colors = ['#516C4B', '#235683', '#303030', '#CCCCCC'];

                        for (; y <= end_y; y++, x = start_x)
                            for (; x <= end_x; x++, i = 0)
                                if (x >= 0 && y >= 0 && x < grid_x_size && y < grid_y_size) {
                                    for (; i < sources[x][y].length; i++) {
                                        source = sources[x][y][i];
                                        if (controls[source.options.control]) {
                                            ctx.strokeStyle = colors[source.options.control];
                                            ctx.beginPath();
                                            coordsx = coords.x * tile.width / pixelScale;
                                            coordsy = coords.y * tile.height / pixelScale;
                                            x1 = (source.points[0][1] + offset[0]) * depth_inverse - coordsx;
                                            y1 = (source.points[0][0] + offset[1]) * depth_inverse - coordsy;
                                            x2 = (source.points[1][1] + offset[0]) * depth_inverse - coordsx;
                                            y2 = (source.points[1][0] + offset[1]) * depth_inverse - coordsy;
                                            ctx.moveTo(x1, y1);
                                            ctx.lineTo(x2, y2);
                                            ctx.stroke();
                                        }
                                        if (Date.now() - startTime > 3) {
                                            setTimeout(() => draw(i, start_x, start_y, end_x, end_y, x, y, step), 0);
                                            return;
                                        }
                                    }
                                    if (Date.now() - startTime > 3) {
                                        setTimeout(() => draw(i, start_x, start_y, end_x, end_y, x, y, step), 0);
                                        return;
                                    }

                                }
                        renderElements.gridLayer.yield(renderElements, 6);
                        return;
                    }
                }
                draw(0, start_x, start_y, end_x, end_y, start_x, start_y, 1);
            },

            calculateControl: function (renderElements) {
                var start = Date.now();
                var max = Math.pow(2, renderElements.gridLayer.maxZoom - renderElements.coords.z);
                var zoom = Math.pow(2, renderElements.coords.z);
                var hdrz = renderElements.hd_ratio / zoom;
                var grid = { x: renderElements.coords.x * max, y: renderElements.coords.y * max };
                var colors = [{ r: 0.1372549019607843, g: 0.3372549019607843, b: 0.5137254901960784 }, { r: 0.3176470588235294, g: 0.4235294117647059, b: 0.2941176470588235 }];

                for (var counter = 0; renderElements.y < renderElements.temp_canvas.height; renderElements.y++, renderElements.x = 0)
                    for (; renderElements.x < renderElements.temp_canvas.width; renderElements.x++, counter++) {
                        if (counter > 16 && Date.now() - start > 3) {
                            setTimeout(() => renderElements.gridLayer.calculateControl(renderElements), 0);
                            return;
                        }

                        var scale = { x: grid.x + (renderElements.x - 1) * hdrz, y: -(grid.y + (renderElements.y - 1) * hdrz) }
                        var v = renderElements.gridLayer.API.control(scale.x, scale.y);

                        if (v < 0) // fade from warden
                        {
                            v++;
                            renderElements.d.data[renderElements.i++] = Math.floor(255 * (v * (.5 - colors[0].r) + colors[0].r));
                            renderElements.d.data[renderElements.i++] = Math.floor(255 * (v * (.5 - colors[0].g) + colors[0].g));
                            renderElements.d.data[renderElements.i] = Math.floor(255 * (v * (.5 - colors[0].b) + colors[0].b));
                            renderElements.i += 2;
                        }
                        else if (v > 0) // fade from colonial
                        {
                            v = 1 - v;
                            renderElements.d.data[renderElements.i++] = Math.floor(255 * (v * (.5 - colors[1].r) + colors[1].r));
                            renderElements.d.data[renderElements.i++] = Math.floor(255 * (v * (.5 - colors[1].g) + colors[1].g));
                            renderElements.d.data[renderElements.i] = Math.floor(255 * (v * (.5 - colors[1].b) + colors[1].b));
                            renderElements.i += 2;
                        }
                    }

                renderElements.temp_ctx.putImageData(renderElements.d, 0, 0);
                delete renderElements.d;

                renderElements.phase_3_complete = true;
                if (renderElements.phase_2_complete) {
                    renderElements.gridLayer.yield(renderElements, 4);
                }
            }

        });

        return {
            Create: (MaxNativeZoom, MaxZoom, Offset, API, RoadWidth, ControlWidth, GridDepth) => {
                var ControlGrid = new VectorControlGridPrototype(
                    {
                        updateWhenZooming: false,
                        noWrap: true,
                        maxZoom: MaxZoom,
                        minZoom: 0
                    });

                var tile_size = ControlGrid.getTileSize();

                ControlGrid.RoadWidth = RoadWidth;
                ControlGrid.ControlWidth = ControlWidth;
                ControlGrid.maxZoom = MaxZoom;
                ControlGrid.grid_depth = GridDepth;
                ControlGrid.offset = Offset;
                var max = Math.pow(2, GridDepth);
                ControlGrid.grid_x_size = max;
                ControlGrid.grid_x_width = (tile_size.x / ControlGrid.grid_x_size);
                ControlGrid.grid_y_size = max;
                ControlGrid.grid_y_height = (tile_size.y / ControlGrid.grid_y_size);
                ControlGrid.max_native_zoom = MaxNativeZoom;
                ControlGrid.API = API;

                var max_road_width = Math.max(RoadWidth, ControlWidth);

                var margin = max_road_width * max;
                var marginx = margin / ControlGrid.grid_x_size;
                var marginy = margin / ControlGrid.grid_y_size;
                
                ControlGrid.road_sources = [];
                for (var x = 0; x < ControlGrid.grid_x_size; x++) {
                    ControlGrid.road_sources.push([]);
                    for (var y = 0; y < ControlGrid.grid_y_size; y++)
                        ControlGrid.road_sources[x].push([]);
                }

                ControlGrid.addRoad = (points, options) => {
                    var c = [[-points[0][0] - Offset[1], points[0][1] - Offset[0]], [-points[1][0] - Offset[1], points[1][1] - Offset[0]]]
                    var p = [[c[0][0], c[0][1]], [c[1][0], c[1][1]]];

                    var x1 = c[0][1] + Offset[0];
                    var y1 = c[0][0] + Offset[1];
                    var x2 = c[1][1] + Offset[0];
                    var y2 = c[1][0] + Offset[1];

                    var angle = Math.atan2(y2 - y1, x2 - x1);
                    var ext_x = Math.cos(angle);
                    var ext_y = Math.sin(angle);

                    x1 -= ext_x * marginx;
                    y1 -= ext_y * marginy;
                    x2 += ext_x * marginx;
                    y2 += ext_y * marginy;

                    var start_tile_x = Math.floor(Math.min(x1, x2) / ControlGrid.grid_x_width - marginx);
                    var start_tile_y = Math.floor(Math.min(y1, y2) / ControlGrid.grid_y_height - marginy);

                    var end_tile_x = Math.floor(Math.max(x2, x1) / ControlGrid.grid_x_width + marginx);
                    var end_tile_y = Math.floor(Math.max(y2, y1) / ControlGrid.grid_y_height + marginy);

                    var width = ControlGrid.grid_x_width + marginx * 2.0;
                    var height = ControlGrid.grid_y_height + marginy * 2.0;

                    for (var x = start_tile_x; x <= end_tile_x; x++)
                        for (var y = start_tile_y; y <= end_tile_y; y++)
                            if (intersects.lineBox(
                                x1, y1,
                                x2, y2,
                                x * ControlGrid.grid_x_width - marginx,
                                y * ControlGrid.grid_y_height - marginy,
                                width, height
                                ))
                                if (x >= 0 && y >= 0 && x < ControlGrid.grid_x_size && y < ControlGrid.grid_y_size)
                                ControlGrid.road_sources[x][y].push({ points: p, options: options });
                };

                ControlGrid.hex_sources = [];
                ControlGrid.addHex = (x, y, width, height, offline) => {
                    ControlGrid.hex_sources.push(
                        {
                            size: {
                                width: width,
                                height: height
                            },
                            x: x + Offset[0] + width * .5,
                            y: y + Offset[1] + height * .5,
                            offline: offline
                        });
                };

                const loaded_events = [];
                const unloaded_events = [];
                ControlGrid.when = function (event_name, event_action) {
                    switch (event_name) {
                        case 'loaded':
                            loaded_events.push(event_action);
                            break;
                        case 'unloaded':
                            unloaded_events.push(event_action);
                            break;
                    }
                };
                ControlGrid.on('loading', () => { for (let i of unloaded_events) i(); });
                ControlGrid.on('load', () => { for (let i of loaded_events) i(); });
                return ControlGrid;
            }
        }
    });