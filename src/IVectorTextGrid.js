define(['leaflet', 'intersects'],
    function (L, intersects) {

        function controlToFont(control, ctx) {
            switch (control) {
                case 0:
                case 1:
                case 2:
                case 3:
                    ctx.font = '70px Renner';
                    break;
                case 4:
                    ctx.font = '90px Renner';
                    break;
            }
        }

        var VectorGridPrototype = L.GridLayer.extend({
            zoomScale: function (zoom) { return .65 * (1 + this.max_zoom - zoom); },
            shadowSize: 20,
            draw: true,
            pixelScale: window.devicePixelRatio,
            recalculateSizes: function () {
                var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
                var ctx = canvas.getContext('2d');
                for (let source of this.sources) {
                    controlToFont(source.control, ctx);
                    var size = ctx.measureText(source.original_text);
                    source.size = {
                        width: (size.actualBoundingBoxRight - size.actualBoundingBoxLeft) / this.grid_x_size,
                        height: (size.actualBoundingBoxAscent + size.actualBoundingBoxDescent) / this.grid_y_size
                    };
                }
            },

            createTile: function (coords, done) {

                var raw_scale = this.zoomScale(coords.z);

                var hd_ratio = this.pixelScale;
                var size = this.getTileSize();
                var tile = null;
                tile = L.DomUtil.create('canvas', 'leaflet-tile logiwaze-text');
                tile.crossorigin = "Anonymous";
                tile.setAttribute("crossorigin", "Anonymous");

                tile.width = size.x * hd_ratio;
                tile.height = size.y * hd_ratio;

                tile.style.width = (size.x * hd_ratio).toString().concat("px");
                tile.style.height = (size.y * hd_ratio).toString().concat("px");

                if (!this.draw) {
                    setTimeout(() => done(null, tile), 0);
                    return tile;
                }

                let ctx = tile.getContext('2d');

                let zoom = Math.pow(2, coords.z);
                let max = Math.pow(2, this.max_zoom);
                let sources = this.sources;
                let shadowSize = this.shadowSize;
                function draw(i) {
                    var startTime = Date.now();
                    for (; i < sources.length; i++) {
                        let source = sources[i];
                        if (coords.z >= source.zoomMin && coords.z < source.zoomMax) {

                            let scale = raw_scale * source.scale;
                            let text_scale = hd_ratio * scale * zoom / max;
                            let shadow = shadowSize * text_scale;
                            let label_w = source.size.width * zoom * scale * hd_ratio + shadow * 2;
                            let label_h = source.size.height * zoom * scale * hd_ratio + shadow * 2;
                            let label_x = source.x * zoom * hd_ratio - coords.x * tile.width - label_w * .5 - shadow;
                            let label_y = source.y * zoom * hd_ratio - coords.y * tile.height - label_h * .25 - shadow;

                            if (intersects.boxBox(0, 0, tile.width, tile.height, label_x, label_y, label_w, label_h)) {
                                ctx.setTransform(text_scale, 0, 0, text_scale, label_x + label_w * .5, label_y + label_h * .5);
                                controlToFont(source.control, ctx);
                                ctx.shadowColor = "rgba(0, 0, 0, 1)";
                                ctx.shadowBlur = shadow;
                                ctx.fillStyle = source.color;
                                ctx.strokeStyle = source.color;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(source.original_text, 0, 0);
                                ctx.fillText(source.original_text, 0, 0);
                                ctx.fillText(source.original_text, 0, 0);
                                ctx.fillText(source.original_text, 0, 0);
                                ctx.shadowColor = "rgba(0, 0, 0, 0)";
                                ctx.shadowBlur = 0;
                                ctx.setTransform(1, 0, 0, 1, 0, 0);
                            }
                        }

                        if (Date.now() - startTime > 3) {
                            setTimeout(() => draw(i), 0);
                            return;
                        }

                    }
                    done(null, tile);
                }
                setTimeout(() => draw(0), 0);
                return tile;
            }
        });

        return {
            Create: function (MaxZoom, Offset) {
                var u = new VectorGridPrototype({ updateWhenZooming: false, noWrap: true });
                var size = u.getTileSize();
                u.sources = [];
                u.max_zoom = MaxZoom;
                u.offset = Offset;
                u.grid_x_size = Math.pow(2, MaxZoom);
                u.grid_x_width = size.x / u.grid_x_size;
                u.grid_y_size = Math.pow(2, MaxZoom);
                u.grid_y_height = size.y / u.grid_y_size;
                u.Offset = Offset;
                var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
                var ctx = canvas.getContext('2d');
                u.Offset = Offset;
                u.addText = (text, original_text, control, x, y, zoomMin, zoomMax, color, scale) => {
                    controlToFont(control, ctx);
                    var size = ctx.measureText(original_text);
                    u.sources.push(
                        {
                            size: {
                                width: (size.actualBoundingBoxRight - size.actualBoundingBoxLeft) / u.grid_x_size,
                                height: (size.actualBoundingBoxAscent + size.actualBoundingBoxDescent) / u.grid_y_size
                            },
                            text: text,
                            original_text: original_text,
                            x: x + Offset[0],
                            y: -(y + Offset[1]) + 256,
                            control: control,
                            zoomMin: zoomMin,
                            zoomMax: zoomMax,
                            color: color,
                            scale: scale == null ? 1 : scale
                        });
                };
                const loaded_events = [];
                const unloaded_events = [];
                u.when = function (event_name, event_action) {
                    switch (event_name) {
                        case 'loaded':
                            loaded_events.push(event_action);
                            break;
                        case 'unloaded':
                            unloaded_events.push(event_action);
                            break;
                    }
                };
                u.on('loading', () => { for (let i of unloaded_events) i(); });
                u.on('load', () => { for (let i of loaded_events) i(); });
                return u;
            }
        }
    });