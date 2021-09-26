define(['leaflet', 'intersects'],
    function (L, intersects) {

        var VectorIconGridPrototype = L.GridLayer.extend({
            disabledIcons: {},
            shadowSize: 20,
            zoomScale: function (zoom) {return .65 * (1 + this.maxZoom - zoom);},

            createTile: function (coords, done) {
                var tile = L.DomUtil.create('canvas', 'leaflet-tile');
                var ctx = tile.getContext('2d');
                var raw_scale = this.zoomScale(coords.z);
                var hd_ratio = 1;
                var size = this.getTileSize();
                
                tile.width = size.x * hd_ratio;
                tile.height = size.y * hd_ratio;
                tile.style.width = tile.width.toString().concat("px");
                tile.style.height = tile.height.toString().concat("px");

                var zoom = Math.pow(2, coords.z);
                var max = Math.pow(2, this.maxZoom);

                tile.pendingLoad = 0;

                for (var source of this.sources) {
                    if (coords.z >= source.zoomMin && coords.z < source.zoomMax && source.icon != null && !(source.icon in this.disabledIcons)) {
                        var scale = raw_scale;
                        let shadow = source.glow ? this.shadowSize * hd_ratio * scale * zoom / max : 0;

                        var label_w = source.size.width * zoom * scale * hd_ratio;
                        var label_h = source.size.height * zoom * scale * hd_ratio;
                        var label_x = source.x * zoom * hd_ratio - coords.x * tile.width - label_w * .5;
                        var label_y = source.y * zoom * hd_ratio - coords.y * tile.height - label_h * .5;

                        if (intersects.boxBox(0, 0, tile.width, tile.height, label_x - 2.0 * shadow, label_y - 2.0 * shadow, label_w + 4.0 * shadow, label_h + 4.0 * shadow)) {
                            var icon = source.icon;
                            var lx = label_x, ly = label_y, lw = label_w, lh = label_h;
                            if (icon in this.imageCache) {
                                var img = this.imageCache[icon];
                                if (img.image.complete) {
                                    if (source.glow) {
                                        ctx.filter = "brightness(0.5) sepia(1) hue-rotate(296deg) saturate(10000%) blur(".concat(shadow).concat("px)"); // blur(10px)
                                        ctx.drawImage(img.image, lx, ly, lw, lh);
                                        ctx.drawImage(img.image, lx, ly, lw, lh);
                                        ctx.drawImage(img.image, lx, ly, lw, lh);
                                        ctx.filter = "none";
                                    }
                                    else
                                        ctx.drawImage(img.image, lx, ly, lw, lh);
                                }
                                else {
                                    img.callbacks.push(makeRenderCallback(ctx, img, lx, ly, lw, lh, done, tile, source.glow, shadow));
                                    tile.pendingLoad++;
                                }
                            }
                            else {
                                tile.pendingLoad++;
                                img = {image: new Image()};
                                img.callbacks = [makeRenderCallback(ctx, img, lx, ly, lw, lh, done, tile, source.glow, shadow)];
                                this.imageCache[icon] = img;
                                img.image.src = 'images/MapIcons/'.concat(source.icon);
                                img.image.onload = makeOnLoadCallback(icon, this);
                            }
                        }
                    }
                }

                if (tile.pendingLoad == 0)
                    setTimeout(() => done(null, tile), 0);
                    
                function makeOnLoadCallback(icon, IconGrid) {
                    return function () {
                        var callbacks = IconGrid.imageCache[icon].callbacks;
                        for (var i = 0; i < callbacks.length; i++)
                            callbacks[i]();
                    };
                }

                function makeRenderCallback(ctx, img, lx, ly, lw, lh, done, tile, glow, shadow) {
                    return function () {
                        if (glow) {
                            ctx.filter = "brightness(0.5) sepia(1) hue-rotate(296deg) saturate(10000%) blur(".concat(shadow).concat("px)"); // blur(10px)
                            ctx.drawImage(img.image, lx, ly, lw, lh);
                            ctx.drawImage(img.image, lx, ly, lw, lh);
                            ctx.drawImage(img.image, lx, ly, lw, lh);
                            ctx.filter = "none";
                        }
                        else
                            ctx.drawImage(img.image, lx, ly, lw, lh);
                        if (--tile.pendingLoad == 0) {
                            setTimeout(() => done(null, tile), 0);
                            delete img.callbacks;
                        }
                    };
                }

                return tile;
            },

            enableIcons: function (icons) {
                for (var i of icons)
                    delete this.disabledIcons[i];
            },

            disableIcons: function (icons) {
                for (var i of icons)
                    this.disabledIcons[i] = true;
            }
        });

        return {
            Create: function (MaxZoom, Offset) {
                var IconGrid = new VectorIconGridPrototype({
                    updateWhenZooming: false
                });
                var size = IconGrid.getTileSize();
                IconGrid.sources = [];
                IconGrid.maxZoom = MaxZoom;
                IconGrid.offset = Offset;
                IconGrid.grid_x_size = Math.pow(2, MaxZoom);
                IconGrid.grid_x_width = size.x / IconGrid.grid_x_size;
                IconGrid.grid_y_size = Math.pow(2, MaxZoom);
                IconGrid.grid_y_height = size.y / IconGrid.grid_y_size;
                IconGrid.imageCache = {};
                IconGrid.addIcon = (icon, x, y, glow, zoomMin, zoomMax) => {
                    IconGrid.sources.push(
                        {
                            size: {
                                width: .5,
                                height: .5
                            },
                            x: x + Offset[0],
                            y: -(y + Offset[1]) + 256,
                            icon: icon,
                            zoomMin: zoomMin,
                            glow: glow,
                            zoomMax: zoomMax,
                            pendingLoad: 0
                        });
                };

                const loaded_events = [];
                const unloaded_events = [];
                IconGrid.when = function (event_name, event_action) {
                    switch (event_name) {
                        case 'loaded':
                            loaded_events.push(event_action);
                            break;
                        case 'unloaded':
                            unloaded_events.push(event_action);
                            break;
                    }
                };
                IconGrid.on('loading', () => {for (let i of unloaded_events) i();});
                IconGrid.on('load', () => {for (let i of loaded_events) i();});
                return IconGrid;
            }
        }
    });