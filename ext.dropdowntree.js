
/*
 * DropDownTreeView
 * 树桩下拉单选框
 */
var DropDownTreeView = kendo.ui.Widget.extend({
    _uid: null,
    _treeview: null,
    _dropdown: null,
    _v: null,

    init: function (element, options) {
        var that = this;
        this.change = options.change;
        kendo.ui.Widget.fn.init.call(that, element, options);
        that._uid = new Date().getTime();
        var idInputBox = kendo.format("extInputBox{0}", that._uid);

        var $dropDown = $("<input class='k-ext-dropdown' style='width:100%'/>").appendTo(element);
        var $treeviewRootElem = $("<div class='k-DropDownTreeView-root' style='z-index: 10003;'></div>").appendTo(document.body);
        $("<span class='k-list-filter'><input id='" + idInputBox + "' class='k-textbox' style='display: inline-block; width:100%;' tabindex='0'><span class='k-icon k-i-zoom'></span></span>").appendTo($treeviewRootElem);
        var $treeView = $("<div class='k-ext-treeview' style='max-height:600px;overflow:scroll;'/>").appendTo($treeviewRootElem);
        $inputBox = $('#' + idInputBox);
        that.conTreeView = $treeviewRootElem;

        var filterTree = function (filterText) {
            console.log('filterTreeD: ' + filterText);
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
            }
        }

        // Create the dropdown.
        that._dropdown = $dropDown.kendoDropDownList({
            dataSource: [{ text: "", value: "" }],
            dataTextField: "text", dataValueField: "value",
            open: function (e) {
                e.preventDefault();
                if (!$treeviewRootElem.hasClass("k-custom-visible")) {
                    // Position the treeview so that it is below the dropdown.
                    $treeviewRootElem.css({
                        "top": $dropdownRootElem.offset().top + $dropdownRootElem.height(),
                        "left": $dropdownRootElem.offset().left
                    });
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
        that._treeview = $treeView.kendoTreeView(treeViewOpt).data("kendoTreeView");
        that._treeview.bind("select", function (e) {
            // When a node is selected, display the text for the node in the dropdown and hide the treeview.
            $dropdownRootElem.find("span.k-input").text($(e.node).children("div").text());
            $treeviewRootElem.slideToggle('fast', function () {
                $treeviewRootElem.removeClass("k-custom-visible");
                that.trigger("select", e);
            });
            var treeValue = this.dataItem(e.node);
            var key = options.valueField ? options.valueField : 'id';
            that._v = treeValue[key];
            //console.log("selected",key, that._v)
            if (that.change) that.change(that._v);
        });
        if (options.url) {
            $.get(options.url, {}, function (ret) {
                ret = list2tree(ret, 'id', 'pId');
                that._treeview.setDataSource(ret);
                //console.log("dropdownData",that.value());
                that.value(that.value());
            }, 'json');
        }

        var defBackground = that._dropdown.list.css("background-color");

        $treeviewRootElem.css({
            "width": $dropdownRootElem.width() < 280 ? "300px" : $dropdownRootElem.width(),
            // "max-height": "90%",
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
                    $treeviewRootElem.slideToggle('fast', function () {
                        $treeviewRootElem.removeClass("k-custom-visible");
                    });
                    //return false;
                }
            }
        });

    },
    value: function (v) {
        if (v === undefined)
            return this._v;

        this._v = v;
        var n = this._treeview.dataSource.get(v);
        if (n) {
            var selectNode = this._treeview.findByUid(n.uid);
            if (selectNode) this._treeview.trigger('select', { node: selectNode });
        }
        this.conTreeView.hide();
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
        name: "DropDownTreeView"
    }
});
kendo.ui.plugin(DropDownTreeView);
