/*
 * Control like L.Control.Layers, but showing layers in a tree.
 * Do not forget to include the css file.
 */

(function(L) {
    if (typeof L === 'undefined') {
        throw new Error('Leaflet must be included first');
    }

    /*
     * L.Control.Layers.Tree extends L.Control.Layers because it reuses
     * most of its functionality. Only the HTML creation is different.
     */
    L.Control.Layers.Tree = L.Control.Layers.extend({
        options: {
            closedSymbol: '+',
            openedSymbol: '&minus;',
            spaceSymbol: ' ',
            selectorBack: false,
            namedToggle: false,
            collapseAll: '',
            expandAll: '',
        },

        // Class names are error prone texts, so write them once here
        _initClassesNames: function() {
            this.cls = {
                children: 'leaflet-layerstree-children',
                childrenNopad: 'leaflet-layerstree-children-nopad',
                hide: 'leaflet-layerstree-hide',
                closed: 'leaflet-layerstree-closed',
                opened: 'leaflet-layerstree-opened',
                space: 'leaflet-layerstree-header-space',
                pointer: 'leaflet-layerstree-header-pointer',
                header: 'leaflet-layerstree-header',
                neverShow: 'leaflet-layerstree-nevershow',
                node: 'leaflet-layerstree-node',
                name: 'leaflet-layerstree-header-name',
                label: 'leaflet-layerstree-header-label',
            };
        },

        initialize: function(baseTree, overlaysTree, options) {
            this._scrollTop = 0;
            this._initClassesNames();
            this._baseTree = null;
            this._overlaysTree = null;
            L.Util.setOptions(this, options);
            L.Control.Layers.prototype.initialize.call(this, null, null, options);
            this._setTrees(baseTree, overlaysTree);
        },

        setBaseTree: function(tree) {
            return this._setTrees(tree);
        },

        setOverlayTree: function(tree) {
            return this._setTrees(undefined, tree);
        },

        addBaseLayer: function(layer, name) {
            throw 'addBaseLayer is disabled';
        },

        addOverlay: function(layer, name) {
            throw 'addOverlay is disabled';
        },

        removeLayer: function(layer) {
            throw 'removeLayer is disabled';
        },

        collapse: function() {
            this._scrollTop = this._form.scrollTop;
            return L.Control.Layers.prototype.collapse.call(this);
        },

        expand: function() {
            var ret = L.Control.Layers.prototype.expand.call(this);
            this._form.scrollTop = this._scrollTop;
        },
// Adds close button to control, code from: https://stackoverflow.com/questions/32584613/manually-close-layer-control-window-javascript
        onAdd: function(map) {
            this._initLayout();
    	    this._addButton();
    	    this._update();            
            
            function changeName(layer) {
                if (layer._layersTreeName) {
                    toggle.innerHTML = layer._layersTreeName;
                }
            }
        //    var ret = L.Control.Layers.prototype.onAdd.call(this._container, map);
            if (this.options.namedToggle) {
                var toggle = this._container.getElementsByClassName('leaflet-control-layers-toggle')[0];
                L.DomUtil.addClass(toggle, 'leaflet-layerstree-named-toggle');
                // Start with this value...
                map.eachLayer(function(layer) {changeName(layer);});
                // ... and change it whenever the baselayer is changed.
                map.on('baselayerchange', function(e) {changeName(e.layer);}, this);
            }
          //  return ret;
return this._container       
 },
    	_addButton: function () {
    	  var elements = this._container.getElementsByClassName('leaflet-control-layers-list');
    	  var button = L.DomUtil.create('button', 'my-button-class', elements[0]);
    	  button.textContent = 'Close control';
    	  L.DomEvent.on(button, 'click', function(e){
    	    L.DomEvent.stop(e);
    	    this._collapse();
    	  }, this);
    	},

        // Expands the whole tree (base other overlays)
        expandTree: function(overlay) {
            var container = overlay ? this._overlaysList : this._baseLayersList;
            if (container) {
                this._applyOnTree(container, false);
            }
            return this._localExpand();
        },

        // Collapses the whole tree (base other overlays)
        collapseTree: function(overlay) {
            var container = overlay ? this._overlaysList : this._baseLayersList;
            if (container) {
                this._applyOnTree(container, true);
            }
            return this._localExpand();
        },

        // Expands the tree, only to show the selected inputs
        expandSelected: function(overlay) {
            function iter(el) {
                // Function to iterate the whole DOM upwards
                var p = el.parentElement;
                if (p) {
                    if (L.DomUtil.hasClass(p, that.cls.children) &&
                        !L.DomUtil.hasClass(el, that.cls.childrenNopad)) {
                        L.DomUtil.removeClass(p, hide);
                    }

                    if (L.DomUtil.hasClass(p, that.cls.node)) {
                        var h = p.getElementsByClassName(that.cls.header)[0];
                        that._applyOnTree(h, false);
                    }
                    iter(p);
                }
            }

            var that = this;
            var container = overlay ? this._overlaysList : this._baseLayersList;
            if (!container) return this;
            var hide = this.cls.hide;
            var inputs = this._layerControlInputs || container.getElementsByTagName('input');
            for (var i = 0; i < inputs.length; i++) {
                // Loop over every (valid) input.
                var input = inputs[i];
                if (this._getLayer && !!this._getLayer(input.layerId).overlay != !!overlay) continue
                if (input.checked) {
                    // Get out of the header,
                    // to not open the posible (but rare) children
                    iter(input.parentElement.parentElement.parentElement.parentElement);
                }
            }
            return this._localExpand();
        },

        // "private" methods, not exposed in the API
        _setTrees: function(base, overlays) {
            var id = 0; // to keep unique id
            function iterate(tree, output, overlays) {
                if (tree && tree.layer) {
                    if (!overlays) {
                        tree.layer._layersTreeName = tree.name || tree.label;
                    }
                    output[id++] = tree.layer;
                }
                if (tree && tree.children && tree.children.length) {
                    tree.children.forEach(function(child) {
                        iterate(child, output, overlays);
                    });
                }
                return output;
            }

            // We accept arrays, but convert into an object with children
            function forArrays(input) {
                if (Array.isArray(input)) {
                    return {noShow: true, children: input};
                } else {
                    return input
                }
            }

            // Clean everything, and start again.
            if (this._layerControlInputs) {
                this._layerControlInputs = [];
            }
            for (var i = 0; i < this._layers.length; ++i) {
                this._layers[i].layer.off('add remove', this._onLayerChange, this);
            }
            this._layers = [];

            if (base !== undefined) this._baseTree = forArrays(base);
            if (overlays !== undefined) this._overlaysTree = forArrays(overlays);

            var bflat = iterate(this._baseTree, {});
            for (var i in bflat) {
                this._addLayer(bflat[i], i);
            }

            var oflat = iterate(this._overlaysTree, {}, true);
            for (i in oflat) {
                this._addLayer(oflat[i], i, true);
            }
            return (this._map) ? this._update() : this;
        },

        // Used to update the vertical scrollbar
        _localExpand: function() {
            if (this._map && L.DomUtil.hasClass(this._container, 'leaflet-control-layers-expanded')) {
                var top = this._form.scrollTop;
                this.expand();
                this._form.scrollTop = top; // to keep the scroll location
                this._scrollTop = top;
            }
            return this;
        },

        // collapses or expands the tree in the containter.
        _applyOnTree: function(container, collapse) {
            var iters = [
                {cls: this.cls.children, hide: collapse},
                {cls: this.cls.opened, hide: collapse},
                {cls: this.cls.closed, hide: !collapse},
            ];
            iters.forEach(function(it) {
                var els = container.getElementsByClassName(it.cls);
                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    if (L.DomUtil.hasClass(el, this.cls.childrenNopad)) {
                        // do nothing
                    } else if (it.hide) {
                        L.DomUtil.addClass(el, this.cls.hide);
                    } else {
                        L.DomUtil.removeClass(el, this.cls.hide);
                    }
                }
            }, this);
        },

        // it is called in the original _update, and shouldn't do anything.
        _addItem: function(obj) {
        },

        // overwrite _update function in Control.Layers
        _update: function() {
            if (!this._container) { return this; }
            L.Control.Layers.prototype._update.call(this);
            this._addTreeLayout(this._baseTree, false);
            this._addTreeLayout(this._overlaysTree, true);
            return this._localExpand();
        },

        // Create the DOM objects for the tree
        _addTreeLayout: function(tree, overlay) {
            if (!tree) return;
            var container = overlay ? this._overlaysList : this._baseLayersList;
            this._expandCollapseAll(overlay, this.options.collapseAll, this.collapseTree);
            this._expandCollapseAll(overlay, this.options.expandAll, this.expandTree);
            this._iterateTreeLayout(tree, container, overlay, tree.noShow)
            if (this._checkDisabledLayers) {
                // to keep compatibility
                this._checkDisabledLayers();
            }
        },

        // Create the "Collapse all" or expand, if needed.
        _expandCollapseAll: function(overlay, text, fn, ctx) {
            var container = overlay ? this._overlaysList : this._baseLayersList;
            ctx = ctx ? ctx : this;
            if (text) {
                var o = document.createElement('div');
                o.className = 'leaflet-layerstree-expand-collapse';
                container.appendChild(o);
                o.innerHTML = text;
                o.tabIndex = 0;
                L.DomEvent.on(o, 'click keydown', function(e) {
                    if (e.type !== 'keydown' || e.keyCode === 32) {
                        o.blur()
                        fn.call(ctx, overlay);
                        this._localExpand();
                    }
                }, this);
            }
        },

        // recursive funtion to create the DOM children
        _iterateTreeLayout: function(tree, container, overlay, noShow) {
            if (!tree) return;
            function creator(type, cls, append, innerHTML) {
                var obj = L.DomUtil.create(type, cls, append);
                if (innerHTML) obj.innerHTML = innerHTML;
                return obj;
            }

            // create the header with it fields
            var header = creator('div', this.cls.header, container);
            var sel = creator('span');
            var entry = creator('span');
            var closed = creator('span', this.cls.closed, sel, this.options.closedSymbol);
            var opened = creator('span', this.cls.opened, sel, this.options.openedSymbol);
            var space = creator('span', this.cls.space, null, this.options.spaceSymbol);
            if (this.options.selectorBack) {
                sel.insertBefore(space, closed);
                header.appendChild(entry);
                header.appendChild(sel);
            } else {
                sel.appendChild(space);
                header.appendChild(sel);
                header.appendChild(entry);
            }

            var hide = this.cls.hide; // To toggle state
            // create the children group, with the header event click
            if (tree.children) {
                var children = creator('div', this.cls.children, container);
                var sensible = tree.layer ? sel : header;
                L.DomUtil.addClass(sensible, this.cls.pointer);
                sensible.tabIndex = 0;
                L.DomEvent.on(sensible, 'click keydown', function(e) {
                    if (e.type === 'keydown' && e.keyCode !== 32) {
                        return
                    }
                    sensible.blur();

                    if (L.DomUtil.hasClass(opened, hide)) {
                        // it is not opened, so open it
                        L.DomUtil.addClass(closed, hide);
                        L.DomUtil.removeClass(opened, hide);
                        L.DomUtil.removeClass(children, hide);
                    } else {
                        // close it
                        L.DomUtil.removeClass(closed, hide);
                        L.DomUtil.addClass(opened, hide);
                        L.DomUtil.addClass(children, hide);
                    }
                    this._localExpand();
                }, this);
                tree.children.forEach(function(child) {
                    var node = creator('div', this.cls.node, children)
                    this._iterateTreeLayout(child, node, overlay);
                }, this);
            } else {
                // no children, so the selector makes no sense.
                L.DomUtil.addClass(sel, this.cls.neverShow);
            }

            // create the input and label, as in Control.Layers
            var label = creator(tree.layer ? 'label' : 'span', this.cls.label, entry);
            if (tree.layer) {
                // now create the element like in _addItem
                var checked = this._map.hasLayer(tree.layer)
                var input;
                var radioGroup = overlay ? tree.radioGroup : 'leaflet-base-layers';
                if (radioGroup) {
                    input = this._createRadioElement(radioGroup, checked);
                } else {
                    input = this._createCheckboxElement(checked);
                }
                if (this._layerControlInputs) {
                    // to keep compatibility with 1.0.3
                    this._layerControlInputs.push(input);
                }
                input.layerId = L.Util.stamp(tree.layer);
                L.DomEvent.on(input, 'click', this._onInputClick, this);
                label.appendChild(input);
            }
            var name = creator('span', this.cls.name, label, tree.label);
            L.DomUtil.addClass(closed, hide);
            if (noShow) {
                L.DomUtil.addClass(header, this.cls.neverShow);
                L.DomUtil.addClass(children, this.cls.childrenNopad);
            }
        },

        _createCheckboxElement: function(checked) {
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'leaflet-control-layers-selector';
            input.defaultChecked = checked;
            return input;
        },

    });

    L.control.layers.tree = function(base, overlays, options) {
        return new L.Control.Layers.Tree(base, overlays, options);
    }

})(L);
