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
            zoomScale: function (zoom) {return .65 * (1 + this.MaxZoom - zoom);},
            shadowSize: 20,
            draw: true,
            pixelScale: window.devicePixelRatio,

            createTile: function (coords, done) {
                var raw_scale = this.zoomScale(coords.z);
                var hd_ratio = this.pixelScale;
                var tile_size = this.getTileSize();
                var tile = L.DomUtil.create('canvas', 'leaflet-tile logiwaze-text');
                tile.crossorigin = "Anonymous";
                tile.setAttribute("crossorigin", "Anonymous");

                tile.width = tile_size.x * hd_ratio;
                tile.height = tile_size.y * hd_ratio;

                tile.style.width = tile.width.toString().concat("px");
                tile.style.height = tile.height.toString().concat("px");

                let ctx = tile.getContext('2d');
                let zoom = Math.pow(2, coords.z);
                let max = Math.pow(2, this.MaxZoom);
                let sources = this.sources;
                let shadowSize = this.shadowSize;

                if (!this.draw) {
                    setTimeout(() => done(null, tile), 0);
                    return tile;
                }

                function draw(i) {
                    var startTime = Date.now();
                    for (; i < sources.length; i++) {
                        let source = sources[i];
                        if (coords.z >= source.MinZoom && coords.z < source.MaxZoom) {

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
            },

            recalculateSizes: function () {
                var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
                var ctx = canvas.getContext('2d');
                for (let source of this.sources) {
                    controlToFont(source.control, ctx);
                    var text_size = ctx.measureText(source.original_text);
                    source.size = {
                        width: (text_size.actualBoundingBoxRight - text_size.actualBoundingBoxLeft) / this.grid_x_size,
                        height: (text_size.actualBoundingBoxAscent + text_size.actualBoundingBoxDescent) / this.grid_y_size
                    };
                }
            },

            
        });

        return {
            Create: function (MaxZoom, Offset) {
                var textGrid = new VectorGridPrototype({
                    updateWhenZooming: false,
                    noWrap: true
                });
                var tile_size = textGrid.getTileSize();
                textGrid.sources = [];
                textGrid.MaxZoom = MaxZoom;
                textGrid.offset = Offset;
                textGrid.grid_x_size = Math.pow(2, MaxZoom);
                textGrid.grid_x_width = tile_size.x / textGrid.grid_x_size;
                textGrid.grid_y_size = Math.pow(2, MaxZoom);
                textGrid.grid_y_height = tile_size.y / textGrid.grid_y_size;
                var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
                var ctx = canvas.getContext('2d');
                textGrid.addText = (text, original_text, control, x, y, MinZoom, MaxZoom, color, scale) => {
                    controlToFont(control, ctx);
                    var text_size = ctx.measureText(original_text);
                    textGrid.sources.push(
                        {
                            size: {
                                width: (text_size.actualBoundingBoxRight - text_size.actualBoundingBoxLeft) / textGrid.grid_x_size,
                                height: (text_size.actualBoundingBoxAscent + text_size.actualBoundingBoxDescent) / textGrid.grid_y_size
                            },
                            text: text,
                            original_text: original_text,
                            x: x + Offset[0],
                            y: -(y + Offset[1]) + 256,
                            control: control,
                            MinZoom: MinZoom,
                            MaxZoom: MaxZoom,
                            color: color,
                            scale: scale == null ? 1 : scale
                        });
                };

                const loaded_events = [];
                const unloaded_events = [];
                textGrid.when = function (event_name, event_action) {
                    switch (event_name) {
                        case 'loaded':
                            loaded_events.push(event_action);
                            break;
                        case 'unloaded':
                            unloaded_events.push(event_action);
                            break;
                    }
                };

                textGrid.on('loading', () => { for (let i of unloaded_events) i(); });
                textGrid.on('load', () => { for (let i of loaded_events) i(); });
                return textGrid;
            }
        }
    });