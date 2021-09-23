define(['leaflet', 'intersects'],
    function (L, intersects) {
        var VectorIconGridPrototype = L.GridLayer.extend({
            quality: true,
            draw: true,
            shadowSize: 20,
            disabledIcons: {},
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
                            renderElements.gridLayer.loadIcons(renderElements);
                            renderElements.img = new Image();
                            var scale = Math.pow(2, Math.max(0, renderElements.coords.z - renderElements.gridLayer.max_native_zoom));
                            renderElements.img.src = 'images/Tiles/'.concat(Math.min(renderElements.coords.z, renderElements.gridLayer.max_native_zoom)).concat('_').concat(Math.floor(renderElements.coords.x / scale)).concat('_').concat(Math.floor(renderElements.coords.y / scale)).concat('.webp');
                            renderElements.phase_2_complete = false;
                            renderElements.phase_3_complete = false;
                            renderElements.img.onload = () => renderElements.gridLayer.yield(renderElements, 2);
                            renderElements.gridLayer.yield(renderElements, 2);
                            return renderElements.tile;
                        }
                    case 2:
                        {
                            renderElements.ctx.save();
                            renderElements.ctx.scale(renderElements.gridLayer.pixelScale, renderElements.gridLayer.pixelScale);
                            renderElements.gridLayer.drawIcons(renderElements);
                            break;
                        }
                    case 3:
                        {
                            renderElements.ctx.restore();
                            setTimeout(() => renderElements.done(null, renderElements.tile), 0);
                            break;
                        }
                }
            },

            yield: (renderElements, phase) => setTimeout(() => renderElements.gridLayer.renderer(renderElements, phase), 0),

            disableIcons: function (icons) {
                for (var icon of icons)
                    this.disabledIcons[icon] = true;
            },

            enableIcons: function (icons) {
                for (var icon of icons)
                    delete this.disabledIcons[icon];
            },

            loadIcons: function (renderElements) {
                var raw_scale = renderElements.gridLayer.zoomScale(renderElements.coords.z);
                var zoom = Math.pow(2, renderElements.coords.z);
                var max = Math.pow(2, renderElements.gridLayer.maxZoom);
                renderElements.pendingLoad = 0;
                const shadowSize = 20;
                for (var source of renderElements.gridLayer.icon_sources) {
                    if (renderElements.coords.z >= source.zoomMin && renderElements.coords.z < source.zoomMax && source.icon != null && !(source.icon in renderElements.gridLayer.disabledIcons)) {
                        var scale = raw_scale;
                        let shadow = source.glow ? shadowSize * scale * zoom / max : 0;
                        var label_w = source.size.width * zoom * scale;
                        var label_h = source.size.height * zoom * scale;
                        var label_x = source.x * zoom - renderElements.coords.x * renderElements.tile.width - label_w * .5;
                        var label_y = source.y * zoom - renderElements.coords.y * renderElements.tile.height - label_h * .5;
                        if (intersects.boxBox(0, 0, renderElements.tile.width, renderElements.tile.height, label_x - 2.0 * shadow, label_y - 2.0 * shadow, label_w + 4.0 * shadow, label_h + 4.0 * shadow)) {
                            if (!(source.icon in renderElements.gridLayer.imageCache)) {
                                renderElements.pendingLoad++;
                                var img = {image: new Image()};
                                renderElements.gridLayer.imageCache[source.icon] = img;
                                img.image.src = 'images/MapIcons/'.concat(source.icon);
                                img.image.onload = function () {
                                    --renderElements.pendingLoad;
                                };
                            }
                        }
                    }
                }
            },

            drawIcons: function (renderElements) {
                function makeOnLoadCallback(icon, IconGrid) {
                    return function () {
                        var callbacks = IconGrid.imageCache[icon].callbacks;
                        for (var i = 0; i < callbacks.length; i++)
                            callbacks[i]();
                    };
                }
                function makeRenderCallback(ctx, img, lx, ly, lw, lh, tile, glow, shadow) {
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
                            renderElements.gridLayer.yield(renderElements, 3);
                            delete img.callbacks;
                        }
                    };
                }

                var raw_scale = renderElements.gridLayer.zoomScale(renderElements.coords.z);
                var zoom = Math.pow(2, renderElements.coords.z);
                var max = Math.pow(2, renderElements.gridLayer.maxZoom);

                renderElements.tile.pendingLoad = 0;

                const shadowSize = 20;

                for (var source of renderElements.gridLayer.icon_sources) {

                    if (renderElements.coords.z >= source.zoomMin && renderElements.coords.z < source.zoomMax && source.icon != null && !(source.icon in renderElements.gridLayer.disabledIcons)) {

                        var scale = raw_scale;
                        let shadow = source.glow ? shadowSize * scale * zoom / max : 0;

                        var label_w = source.size.width * zoom * scale;
                        var label_h = source.size.height * zoom * scale;
                        var label_x = source.x * zoom - renderElements.coords.x * renderElements.tile.width / renderElements.gridLayer.pixelScale - label_w * .5;
                        var label_y = source.y * zoom - renderElements.coords.y * renderElements.tile.height / renderElements.gridLayer.pixelScale - label_h * .5;

                        if (intersects.boxBox(0, 0, renderElements.tile.width / renderElements.gridLayer.pixelScale, renderElements.tile.height / renderElements.gridLayer.pixelScale, label_x - 2.0 * shadow, label_y - 2.0 * shadow, label_w + 4.0 * shadow, label_h + 4.0 * shadow)) {
                            var icon = source.icon;
                            var lx = label_x, ly = label_y, lw = label_w, lh = label_h;
                            if (icon in renderElements.gridLayer.imageCache) {
                                var img = renderElements.gridLayer.imageCache[icon];
                                if (img.image.complete) {
                                    if (source.glow) {
                                        renderElements.ctx.save();
                                        renderElements.ctx.filter = "brightness(0.5) sepia(1) hue-rotate(296deg) saturate(10000%) blur(".concat(shadow).concat("px)"); // blur(10px)
                                        renderElements.ctx.drawImage(img.image, lx, ly, lw, lh);
                                        renderElements.ctx.drawImage(img.image, lx, ly, lw, lh);
                                        renderElements.ctx.drawImage(img.image, lx, ly, lw, lh);
                                        renderElements.ctx.restore();
                                    }
                                    else
                                        renderElements.ctx.drawImage(img.image, lx, ly, lw, lh);
                                }
                                else {
                                    // img.callbacks.push(makeRenderCallback(renderElements.ctx, img, lx, ly, lw, lh, renderElements.tile, source.glow, shadow));
                                    renderElements.tile.pendingLoad++;
                                }
                            }
                            else {
                                renderElements.tile.pendingLoad++;
                                img = { image: new Image() };
                                img.callbacks = [makeRenderCallback(renderElements.ctx, img, lx, ly, lw, lh, renderElements.tile, source.glow, shadow)];
                                renderElements.gridLayer.imageCache[icon] = img;
                                img.image.src = 'images/MapIcons/'.concat(source.icon);
                                img.image.onload = makeOnLoadCallback(icon, renderElements.t);
                            }
                        }
                    }
                }
                if (renderElements.tile.pendingLoad == 0)
                    renderElements.gridLayer.yield(renderElements, 3);
            }
        });

        return {
            Create: (MaxNativeZoom, MaxZoom, Offset) => {
                var IconGrid = new VectorIconGridPrototype(
                    {
                        updateWhenZooming: false,
                        noWrap: true,
                        maxZoom: MaxZoom,
                        minZoom: 0
                    });

                var tile_size = IconGrid.getTileSize();

                IconGrid.maxZoom = MaxZoom;
                IconGrid.offset = Offset;
                IconGrid.max_native_zoom = MaxNativeZoom;
                IconGrid.icon_grid_x_size = Math.pow(2, MaxZoom);
                IconGrid.icon_grid_x_width = IconGrid.pixelScale * tile_size.x / IconGrid.grid_x_size;
                IconGrid.icon_grid_y_size = Math.pow(2, MaxZoom);
                IconGrid.icon_grid_y_height = IconGrid.pixelScale * tile_size.y / IconGrid.grid_y_size;
                IconGrid.imageCache = {};

                IconGrid.icon_sources = [];
                IconGrid.addIcon = (icon, x, y, glow, zoomMin, zoomMax) => {
                    IconGrid.icon_sources.push(
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
                IconGrid.on('loading', () => { for (let i of unloaded_events) i(); });
                IconGrid.on('load', () => { for (let i of loaded_events) i(); });
                return IconGrid;
            }
        }
    });