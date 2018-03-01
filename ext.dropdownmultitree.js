
/*
 * DropDownMultiTreeView
 * 树桩下拉多选框（new）
 */
var DropDownMultiTreeView = kendo.ui.Widget.extend({
    _uid: null,
    _treeview: null,
    _dropdown: null,
    _v: [],

    init: function (element, options) {
        var that = this;
        this.change = options.change;
        kendo.ui.Widget.fn.init.call(that, element, options);
        that._uid = new Date().getTime();
        var idDropDown = kendo.format("extDropDown{0}", that._uid);
        var idInputBox = kendo.format("extInputBox{0}", that._uid);

        var $dropDown = $("<input class='k-ext-dropdown' style='width:100%'/>").appendTo(element);
        var $treeviewRootElem = $("<div id='con" + idDropDown + "' class='k-DropDownTreeView-root' style='z-index:1;'></div>").appendTo(element);
        $("<span class='k-list-filter'><input id='" + idInputBox + "' class='k-textbox' style='display: inline-block; width:100%;' tabindex='0'><span class='k-icon k-i-zoom'></span></span>").appendTo($treeviewRootElem);
        var $treeView = $("<div class='k-ext-treeview' style='max-height:600px;overflow:scroll;' />").appendTo($treeviewRootElem);
        $inputBox = $('#' + idInputBox);
        that.conTreeView = $treeviewRootElem;

        var filterTree = function (filterText) {
            // console.log('filterTreeD: ' + filterText);
            if (filterText !== "") {
                //$(".selectAll").css("visibility", "hidden");
                $treeView.find(".k-group .k-group .k-in").closest("li").hide();
                $treeView.find(".k-group").closest("li").hide();
                $treeView.find(".k-in:contains(" + filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $treeView.data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
                $treeView.find(".k-group .k-in:contains(" + filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        $(this).show();
                    });
                });
            } else {
                $treeView.find(".k-group").find("li").show();

                // var nodes = $(idTreeViewN+" > .k-group > li");
                // $.each(nodes, function (i, val) {
                //     if (nodes[i].getAttribute("data-expanded") == null) {
                //         $(nodes[i]).find("li").hide();
                //     }
                // });
            }
        }

        // Create the dropdown.
        that._dropdown = $dropDown.kendoDropDownList({
            dataSource: [{ text: "", value: "" }],
            dataTextField: "text", dataValueField: "value",
            open: function (e) {
                e.preventDefault();
                if (!$treeviewRootElem.hasClass("k-custom-visible")) {
                    that.OnValueChanged(that.value());

                    // Position the treeview so that it is below the dropdown.
                    $treeviewRootElem.css({
                        "top": $dropdownRootElem.position().top + $dropdownRootElem.height(),
                        "left": $dropdownRootElem.position().left
                    });
                    //var ii = $('#con'+idDropDown).find('input');
                    //ii.focus();
                    //console.log(ii);
                    //var oInput = document.getElementById(idInputBox);
                    //oInput.focus();

                    $inputBox.val('');
                    $inputBox.focus();
                    filterTree('');
                    // Display the treeview.
                    $treeviewRootElem.slideToggle('fast', function () {
                        that._dropdown.close();
                        $treeviewRootElem.addClass("k-custom-visible");
                    });
                }
            }
        }).data("kendoDropDownList");

        //if (options.dropDownWidth) that._dropdown._inputWrapper.width(options.dropDownWidth);

        var $dropdownRootElem = $(that._dropdown.element).closest("span.k-dropdown");

        // Create the treeview.
        var treeViewOpt = options.treeview ? options.treeview : {};
        treeViewOpt.checkboxes = { checkChildren: true };
        treeViewOpt.check = function () {
            //console.log('check')
            $treeviewRootElem.addClass("k-custom-visible");
            that.OnTreeCheckChanged();
        };
        //console.log("treeViewOpt",treeViewOpt)
        that._treeview = $treeView.kendoTreeView(treeViewOpt).data("kendoTreeView");

        that._treeview.bind("select", function (e) {
            if (e && e.node){
                var d = this.dataItem(e.node);
                d.set("checked", !d.checked);
                that.OnTreeCheckChanged();
            } 
        });
        if (options.url) {
            $.get(options.url, {}, function (ret) { ret = list2tree(ret, 'id', 'pId'); that._treeview.setDataSource(ret); }, 'json');
        }

        var defBackground = that._dropdown.list.css("background-color");

        $treeviewRootElem.width($dropdownRootElem.width()).css({
            // "max-height": "600px",
            "border": "1px solid #dbdbdb",
            "display": "none",
            "position": "absolute",
            "background-color": defBackground
        });
        $inputBox.css({
            "border": "1px solid #dbdbdb",
            "background-color": defBackground
        });
        $inputBox.keyup(function (e) { filterTree($(this).val()); });

        $(document).click(function (e) {
            if ($(e.target).closest("div.k-DropDownTreeView-root").length === 0
                && $(e.target).closest("input.k-ext-dropdown").length === 0) {// Ignore clicks on the treetriew.
                if ($treeviewRootElem.hasClass("k-custom-visible")) { // If visible, then close the treeview.
                    // console.log("dropdown关闭")
                    that.OnTreeCheckChanged();
                    if (that.change) that.change(that.value());
                    $treeviewRootElem.slideToggle('fast', function () {
                        $treeviewRootElem.removeClass("k-custom-visible");
                    });
                    //return false;
                }
            }
        });

    },
    value: function (v) {
        if (v !== undefined) {
            //console.log('setValue',v)
            this.OnValueChanged(v);
            this.OnTreeCheckChanged();
            // $(this._treeview.element).closest("div.k-treeview").hide();
            this.conTreeView.hide();
        }else {
            //console.log('getValue',this._v)
            return this._v;
        }
    },
    getCheckedNodes: function (nodes, checkedNodes, texts) {
        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.checked && texts)
                texts.push(node.text);
            if (node.checked && !node.hasChildren) // 包含子节点的不算
                checkedNodes.push({ text: node.text, id: node.id });
            if (node.hasChildren)
                this.getCheckedNodes(node.children.view(), checkedNodes, node.checked?null:texts);
        }
    },
    OnTreeCheckChanged: function () {
        var checkedNodes = [];
        var texts = [];
        this.getCheckedNodes(this._treeview.dataSource.view(), checkedNodes, texts);

        var values = [];
        if (checkedNodes.length > 0) {
            for (var i = 0; i < checkedNodes.length; i++) {
                var node = checkedNodes[i];
                values.push(node.id.toString());
            }
        }
        this._v = values;
        var root = $(this._dropdown.element).closest("span.k-dropdown");
        //console.log(this._v, root.find("span.k-input"));
        root.find("span.k-input").text(texts.join(','));
    },
    checkUncheckAllNodes: function (nodes, checked) {
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].set("checked", checked);
            if (nodes[i].hasChildren) {
                this.checkUncheckAllNodes(nodes[i].children.view(), checked);
            }
        }
    },
    OnValueChanged: function (values) {
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

    dropDownList: function () {
        return this._dropdown;
    },

    treeview: function () {
        return this._treeview;
    },
    refresh: function () {
        return this._treeview.dataSource.read();
    },
    options: {
        name: "DropDownMultiTreeView"
    }
});
kendo.ui.plugin(DropDownMultiTreeView);