
/*
 * MultiSelectTree
 * 多选下拉框 (支持过滤)
 */
var MultiSelectTree1 = kendo.ui.Widget.extend({
    _uid: null,
    _treeview: null,
    _multiselect: null,

    init: function (element, options) {
        var that = this;
        this.change = options.change;
        kendo.ui.Widget.fn.init.call(that, element, options);
        that._uid = new Date().getTime();
        var idTreeView = kendo.format("extTreeView{0}", that._uid)

        var $multiSel = $("<select/>").appendTo(element);
        $(element).append("<div id='" + idTreeView + "' class='k-ext-treeview' style='z-index:1;'/>");

        var filterTree = function (filterText) {
            console.log('filterTree: ' + filterText);
            // return;
            var idTreeViewN = '#' + idTreeView;
            if (filterText !== "") {
                //$(".selectAll").css("visibility", "hidden");
                $(idTreeViewN + " .k-group .k-group .k-in").closest("li").hide();
                $(idTreeViewN + " .k-group").closest("li").hide();
                $(idTreeViewN + " .k-in:contains(" + filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $(idTreeViewN).data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
                $(idTreeViewN + " .k-group .k-in:contains(" + filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        $(this).show();
                    });
                });
            } else {
                $(idTreeViewN + " .k-group").find("li").show();
                // var nodes = $(idTreeViewN+" > .k-group > li");
                // $.each(nodes, function (i, val) {
                //     console.log(nodes[i])
                //     if (nodes[i].getAttribute("data-expanded") == null) {
                //         $(nodes[i]).find("li").hide();
                //     }
                // });
                //$(".selectAll").css("visibility", "visible");
            }
        }

        // Create the multiselect.
        that._multiselect = $multiSel.kendoMultiSelect({
            dataSource: [{ text: "", value: "" }],
            dataTextField: "text", dataValueField: "value",
            autoBind: false,
            open: function (e) {
                console.log("open");
                e.preventDefault();
                if (!$treeviewRootElem.hasClass("k-custom-visible")) {
                    that.OnValueChanged(this.value());

                    // Position the treeview so that it is below the dropdown.
                    var pos = $dropdownRootElem.position();
                    $treeviewRootElem.css({ "top": pos.top + $dropdownRootElem.height(), "left": pos.left });
                    // Display the treeview.
                    $treeviewRootElem.slideToggle('fast', function () {
                        that._multiselect.close();
                        $treeviewRootElem.addClass("k-custom-visible");
                    });
                }
                filterTree(this.input.val());
            }, change: function (e) {
                if (that.change) that.change(this.value());
            }
        }).data("kendoMultiSelect");

        var $dropdownRootElem = $(that._multiselect.element).closest("div.k-multiselect");
        if (options.dropDownWidth) $dropdownRootElem.width(options.dropDownWidth);

        // function onCheck(e) {
        //     var checkedNodes = [];
        //     that.getCheckedNodes(that._treeview.dataSource.view(), checkedNodes);
        // }

        // Create the treeview.
        var treeViewOpt = options.treeview ? options.treeview : {};
        treeViewOpt.checkboxes = { checkChildren: true };
        //treeViewOpt.check = onCheck;
        that._treeview = $("#" + idTreeView).kendoTreeView(treeViewOpt).data("kendoTreeView");
  
        if (options.url) {
            $.get(options.url, {}, function (ret) { that._treeview.setDataSource(ret); }, 'json');
        }

        var $treeviewRootElem = $(that._treeview.element).closest("div.k-treeview");

        // Hide the treeview.
        $treeviewRootElem.width($dropdownRootElem.width()).css({
            "border": "1px solid #dbdbdb",
            "display": "none",
            "position": "absolute",
            "background-color": that._multiselect.list.css("background-color")
        });

        $(document).click(function (e) {
            if ($(e.target).closest("div.k-treeview").length !== 0) return;// Ignore clicks on the treetriew.
            if (!$treeviewRootElem.hasClass("k-custom-visible")) return;// Ignore If not visible
            //console.log('click');

            that.OnTreeCheckChanged();
            if (that.change) that.change(that._multiselect.value());

            $treeviewRootElem.slideToggle('fast', function () {
                $treeviewRootElem.removeClass("k-custom-visible");
            });
        });
    },
    value: function (values) {
        var that = this;
        if (values !== undefined) {
            this.OnValueChanged(values);
            this.OnTreeCheckChanged();
            $(that._treeview.element).closest("div.k-treeview").hide();
        } else {
            return that._multiselect.value();
        }
    },

    getCheckedNodes : function (nodes, checkedNodes) {
        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.checked && !node.hasChildren) // 包含子节点的不算
                checkedNodes.push({ text: node.text, id: node.id });
            if (node.hasChildren)
                this.getCheckedNodes(node.children.view(), checkedNodes);
        }
    },
    OnTreeCheckChanged:function(){
        var checkedNodes = [];
        this.getCheckedNodes(this._treeview.dataSource.view(), checkedNodes);

        var multiSelect = this._multiselect;
        multiSelect.dataSource.data([]);
        var multiData = [];//multiSelect.dataSource.data();
        var array = [];//multiSelect.value().slice();
        if (checkedNodes.length > 0) {
            for (var i = 0; i < checkedNodes.length; i++) {
                multiData.push({ text: checkedNodes[i].text, value: checkedNodes[i].id });
                array.push(checkedNodes[i].id.toString());
            }
            multiSelect.dataSource.data(multiData);
        }
        multiSelect.dataSource.filter({});
        multiSelect.value(array);
    },
    checkUncheckAllNodes : function (nodes, checked) {
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].set("checked", checked);
            if (nodes[i].hasChildren) {
                this.checkUncheckAllNodes(nodes[i].children.view(), checked);
            }
        }
    },
    OnValueChanged:function(values){
        //console.log('OnValueChanged', values);
        // Uncheck all
        this.checkUncheckAllNodes(this._treeview.dataSource.view(), false);

        // Check values
        for (var i = 0; i < values.length; ++i) {
            var vi = this._treeview.dataSource.get(values[i]);
            if (vi) {
                var ve = this._treeview.findByUid(vi.uid);
                if (ve) this._treeview.dataItem(ve).set("checked", true);
                //console.log(this._treeview.dataItem(ve).id);
            }
        }
    },

    multiSelect: function () {
        return this._multiselect;
    },

    treeview: function () {
        return this._treeview;
    },
    refresh: function () {
        return this._treeview.dataSource.read();
    },
    options: {
        name: "MultiSelectTree"
    }
});
var MultiSelectTree = kendo.ui.Widget.extend({
    _uid: null,
    _treeview: null,
    _multiselect: null,

    init: function (element, options) {
        var that = this;
        this.change = options.change;
        kendo.ui.Widget.fn.init.call(that, element, options);
        that._uid = new Date().getTime();
        var idTreeView = kendo.format("extTreeView{0}", that._uid)

        var $multiSel = $("<select/>").appendTo(element);
        // $(element).append("<div id='" + idTreeView + "' class='k-ext-treeview' style='z-index:1;'/>");
        var $treeviewRootElem = $("<div class='k-ext-treeview' style='z-index:1;'/>").appendTo(element);

        var filterTree = function (filterText) {
            console.log('filterTree: ' + filterText);
            // return;
            if (filterText !== "") {
                //$(".selectAll").css("visibility", "hidden");
                $treeviewRootElem.find(" .k-group .k-group .k-in").closest("li").hide();
                $treeviewRootElem.find(" .k-group").closest("li").hide();
                $treeviewRootElem.find(" .k-in:contains(" + filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $treeviewRootElem.data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
                $treeviewRootElem.find(" .k-group .k-in:contains(" + filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        $(this).show();
                    });
                });
            } else {
                $treeviewRootElem.find(" .k-group").find("li").show();
            }
        }

        // Create the multiselect.
        that._multiselect = $multiSel.kendoMultiSelect({
            dataSource: [{ text: "", value: "" }],
            dataTextField: "text", dataValueField: "value",
            autoBind: false,
            open: function (e) {
                console.log("open");
                e.preventDefault();
                if (!$treeviewRootElem.hasClass("k-custom-visible")) {
                    that.OnValueChanged(this.value());

                    // Position the treeview so that it is below the dropdown.
                    var pos = $dropdownRootElem.position();
                    $treeviewRootElem.css({ "top": pos.top + $dropdownRootElem.height(), "left": pos.left });
                    // Display the treeview.
                    $treeviewRootElem.slideToggle('fast', function () {
                        that._multiselect.close();
                        $treeviewRootElem.addClass("k-custom-visible");
                    });
                }
                filterTree(this.input.val());
            }, change: function (e) {
                if (that.change) that.change(this.value());
            }
        }).data("kendoMultiSelect");

        var $dropdownRootElem = $(that._multiselect.element).closest("div.k-multiselect");
        if (options.dropDownWidth) $dropdownRootElem.width(options.dropDownWidth);

        // function onCheck(e) {
        //     var checkedNodes = [];
        //     that.getCheckedNodes(that._treeview.dataSource.view(), checkedNodes);
        // }

        // Create the treeview.
        var treeViewOpt = options.treeview ? options.treeview : {};
        treeViewOpt.checkboxes = { checkChildren: true };
        //treeViewOpt.check = onCheck;
        that._treeview = $treeviewRootElem.kendoTreeView(treeViewOpt).data("kendoTreeView");
        console.log("that._treeview",that._treeview)
        if (options.url) {
            $.get(options.url, {}, function (ret) { that._treeview.setDataSource(ret); }, 'json');
        }

        var $treeviewRootElem = $(that._treeview.element).closest("div.k-treeview");

        // Hide the treeview.
        $treeviewRootElem.width($dropdownRootElem.width()).css({
            "border": "1px solid #dbdbdb",
            "display": "none",
            "position": "absolute",
            "background-color": that._multiselect.list.css("background-color")
        });

        $(document).click(function (e) {
            if ($(e.target).closest("div.k-treeview").length !== 0) return;// Ignore clicks on the treetriew.
            if (!$treeviewRootElem.hasClass("k-custom-visible")) return;// Ignore If not visible
            console.log('click');

            that.OnTreeCheckChanged();
            if (that.change) that.change(that._multiselect.value());

            $treeviewRootElem.slideToggle('fast', function () {
                $treeviewRootElem.removeClass("k-custom-visible");
            });
        });
        
    },
    value: function (values) {
        var that = this;
        if (values !== undefined) {
            this.OnValueChanged(values);
            this.OnTreeCheckChanged();
            $(that._treeview.element).closest("div.k-treeview").hide();
        } else {
            return that._multiselect.value();
        }
    },

    getCheckedNodes : function (nodes, checkedNodes) {
        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.checked && !node.hasChildren) // 包含子节点的不算
                checkedNodes.push({ text: node.text, id: node.id });
            if (node.hasChildren)
                this.getCheckedNodes(node.children.view(), checkedNodes);
        }
    },
    OnTreeCheckChanged:function(){
        var checkedNodes = [];
        this.getCheckedNodes(this._treeview.dataSource.view(), checkedNodes);

        var multiSelect = this._multiselect;
        multiSelect.dataSource.data([]);
        var multiData = [];//multiSelect.dataSource.data();
        var array = [];//multiSelect.value().slice();
        if (checkedNodes.length > 0) {
            for (var i = 0; i < checkedNodes.length; i++) {
                multiData.push({ text: checkedNodes[i].text, value: checkedNodes[i].id });
                array.push(checkedNodes[i].id.toString());
            }
            multiSelect.dataSource.data(multiData);
        }
        multiSelect.dataSource.filter({});
        multiSelect.value(array);
    },
    checkUncheckAllNodes : function (nodes, checked) {
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].set("checked", checked);
            if (nodes[i].hasChildren) {
                this.checkUncheckAllNodes(nodes[i].children.view(), checked);
            }
        }
    },
    OnValueChanged:function(values){
        //console.log('OnValueChanged', values);
        // Uncheck all
        this.checkUncheckAllNodes(this._treeview.dataSource.view(), false);

        // Check values
        for (var i = 0; i < values.length; ++i) {
            var vi = this._treeview.dataSource.get(values[i]);
            if (vi) {
                var ve = this._treeview.findByUid(vi.uid);
                if (ve) this._treeview.dataItem(ve).set("checked", true);
                //console.log(this._treeview.dataItem(ve).id);
            }
        }
    },

    multiSelect: function () {
        return this._multiselect;
    },

    treeview: function () {
        return this._treeview;
    },
    refresh: function () {
        return this._treeview.dataSource.read();
    },
    options: {
        name: "MultiSelectTree"
    }
});
kendo.ui.plugin(MultiSelectTree);
