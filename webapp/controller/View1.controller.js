sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("splictapp.controller.View1", {

        /* =========================================
           INITIALIZATION
        ========================================= */
        onInit: function () {
            var oMainModel = new JSONModel();
            this.getView().setModel(oMainModel); // default model

            var oDetailModel = new JSONModel();
            this.getView().setModel(oDetailModel, "detailModel");

            var that = this;

            oMainModel.loadData("../model/data.json");

            oMainModel.attachRequestCompleted(function () {
    var aOrders = oMainModel.getProperty("/Orders") || [];
    oMainModel.setProperty("/ordersCount", aOrders.length);

    aOrders.forEach(oOrder => {
        if (!oOrder.image) {
            switch (oOrder.Category) {
                case "Computer Peripherals":
                    oOrder.image = "images/laptop.jpg";
                    break;
                case "Mobiles":
                    oOrder.image = "images/mobile.jpg";
                    break;
                case "Music Systems":
                    oOrder.image = "images/earphone.jpg";
                    break;
                default:
                    oOrder.image = "images/monitor.jpg";
            }
        }
    });

    // ⭐⭐ THIS LINE FIXES MASTER PAGE IMAGES ⭐⭐
    oMainModel.refresh(true);

;
     

                // Optional: show first order by default
                if (aOrders.length > 0) {
                    that._showDetailPage(aOrders[0]);
                }
            });
        },

        /* =========================================
           UTIL - UPDATE ORDER COUNT (after search/filter)
        ========================================= */
        _updateOrderCount: function () {
            var oList = this.byId("orderList");
            var oBinding = oList.getBinding("items");

            var iCount = oBinding.getLength();
            this.getView().getModel().setProperty("/ordersCount", iCount);
        },

        /* =========================================
           MASTER LIST ITEM PRESS
        ========================================= */
        onOrderPress: function (oEvent) {
            var oCtx = oEvent.getParameter("listItem").getBindingContext();
            if (!oCtx) return;

            var oData = oCtx.getObject();
            this._showDetailPage(oData);
        },

        /* =========================================
           NAVIGATE TO PROPER DETAIL PAGE
        ========================================= */
        _showDetailPage: function (oData) {
            var oSplitApp = this.byId("splitApp");

            var mPageMap = {
                "Computer Peripherals": "detailPage1",
                "Mobiles": "detailPage2",
                "Music Systems": "detailPage3"
            };

            var sTarget = mPageMap[oData.Category] || "detailPage1";
            var oDetailPage = this.byId(sTarget);

            this.getView().getModel("detailModel").setData(oData);

            oSplitApp.toDetail(oDetailPage);
        },

        /* =========================================
           LIVE SEARCH
        ========================================= */
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var oList = this.byId("orderList");
            var oBinding = oList.getBinding("items");

            if (!sQuery) {
                oBinding.filter([]);
                this._updateOrderCount();
                return;
            }

            var aFilters = [
                new Filter("OrderID",       FilterOperator.Contains, sQuery),
                new Filter("CustomerName",  FilterOperator.Contains, sQuery),
                new Filter("Category",      FilterOperator.Contains, sQuery)
            ];

            oBinding.filter([new Filter({ filters: aFilters, and: false })]);

            this._updateOrderCount();
        },

        /* =========================================
           OPEN FILTER DIALOG
        ========================================= */
        onOpenFilter: function () {
            if (!this._oFilterDialog) {
                this._oFilterDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "splictapp.fragments.FilterDialog",
                    this
                );
                this.getView().addDependent(this._oFilterDialog);
            }
            this._oFilterDialog.open();
        },

        onCancel: function () {
            if (this._oFilterDialog) this._oFilterDialog.close();
        },

        /* =========================================
           F4 HELP - ORDER ID
        ========================================= */
        onOrderIdValueHelp: function () {
            var aOrders = this.getView().getModel().getProperty("/Orders") || [];

            var sCustomer = this.byId("customerNameInput").getValue();
            var sCategory = this.byId("categoryInput").getValue();

            var aFiltered = aOrders.filter(function (o) {
                if (sCustomer && o.CustomerName !== sCustomer) return false;
                if (sCategory && o.Category !== sCategory) return false;
                return true;
            });

            var aItems = [...new Set(aFiltered.map(o => o.OrderID))]
                .map(v => ({ OrderID: v }));

            var oVHModel = new JSONModel({ results: aItems });

            if (!this.oOrderVH) {
                this.oOrderVH = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "splictapp.fragments.OrderID",
                    this
                );
                this.getView().addDependent(this.oOrderVH);

                this.oOrderVH.attachConfirm(function (e) {
                    var sSel = e.getParameter("selectedItem").getTitle();
                    this.byId("orderIdInput").setValue(sSel);
                }.bind(this));
            }

            this.oOrderVH.setModel(oVHModel, "valuehelpM");
            this.oOrderVH.open();
        },

        /* =========================================
           F4 HELP - CATEGORY
        ========================================= */
        onCategoryValueHelp: function () {
            var aOrders = this.getView().getModel().getProperty("/Orders") || [];

            var sID       = this.byId("orderIdInput").getValue();
            var sCustomer = this.byId("customerNameInput").getValue();
           

            var aFiltered = aOrders.filter(function (o) {
                if (sID && o.OrderID !== sID) return false;
                if (sCustomer && o.CustomerName !== sCustomer) return false;
                return true;
            });

            var aItems = [...new Set(aFiltered.map(o => o.Category))]
                .map(v => ({ Category: v }));

            var oVHModel = new JSONModel({ results: aItems });

            if (!this.oCatVH) {
                this.oCatVH = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "splictapp.fragments.Category",
                    this
                );
                this.getView().addDependent(this.oCatVH);

                this.oCatVH.attachConfirm(function (e) {
                    var sSel = e.getParameter("selectedItem").getTitle();
                    this.byId("categoryInput").setValue(sSel);
                }.bind(this));
            }

            this.oCatVH.setModel(oVHModel, "valuehelpM");
            this.oCatVH.open();
        },

        /* =========================================
           F4 HELP - CUSTOMER NAME
        ========================================= */
        onCustomerNameValueHelp: function () {
            var aOrders = this.getView().getModel().getProperty("/Orders") || [];

            var sID       = this.byId("orderIdInput").getValue();
            var sCategory = this.byId("categoryInput").getValue();

            var aFiltered = aOrders.filter(function (o) {
                if (sID && o.OrderID !== sID) return false;
                if (sCategory && o.Category !== sCategory) return false;
                return true;
            });

            var aItems = [...new Set(aFiltered.map(o => o.CustomerName))]
                .map(v => ({ CustomerName: v }));

            var oVHModel = new JSONModel({ results: aItems });

            if (!this.oCustVH) {
                this.oCustVH = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "splictapp.fragments.Name",
                    this
                );
                this.getView().addDependent(this.oCustVH);

                this.oCustVH.attachConfirm(function (e) {
                    var sSel = e.getParameter("selectedItem").getTitle();
                    this.byId("customerNameInput").setValue(sSel);
                }.bind(this));
            }

            this.oCustVH.setModel(oVHModel, "valuehelpM");
            this.oCustVH.open();
        },

        /* =========================================
           APPLY FILTER
        ========================================= */
        onApply: function () {
            var sID       = this.byId("orderIdInput").getValue();
            var sCustomer = this.byId("customerNameInput").getValue();
            var sCategory = this.byId("categoryInput").getValue();

            var oList = this.byId("orderList");
            var oBinding = oList.getBinding("items");

            var aFilters = [];

            if (sID) aFilters.push(new Filter("OrderID", FilterOperator.EQ, sID));
            if (sCustomer) aFilters.push(new Filter("CustomerName", FilterOperator.Contains, sCustomer));
            if (sCategory) aFilters.push(new Filter("Category", FilterOperator.Contains, sCategory));

            oBinding.filter(aFilters);

            this._updateOrderCount();

            var aContexts = oBinding.getContexts();
            if (aContexts.length > 0) {
                this._showDetailPage(aContexts[0].getObject());
            }

            this._oFilterDialog.close();
        },

        /* =========================================
           RESET FILTERS
        ========================================= */
        onClearFilter: function () {
            var oList = this.byId("orderList");
            oList.getBinding("items").filter([]);

            this.byId("searchField").setValue("");

            this.byId("orderIdInput")?.setValue("");
            this.byId("customerNameInput")?.setValue("");
            this.byId("categoryInput")?.setValue("");

            this._updateOrderCount();

            MessageToast.show("Filters cleared");
        },

        /* =========================================
           VALUE HELP SEARCHES
        ========================================= */
        onOrderIdSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value") || "";
            var oBinding = oEvent.getSource().getBinding("items");

            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter("OrderID", FilterOperator.StartsWith, sValue));
            }
            oBinding.filter(aFilters);
        },

        onCustomerSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value") || "";
            var oBinding = oEvent.getSource().getBinding("items");

            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter("CustomerName", FilterOperator.Contains, sValue));
            }
            oBinding.filter(aFilters);
        },

        onCategorySearch: function (oEvent) {
            var sValue = oEvent.getParameter("value") || "";
            var oBinding = oEvent.getSource().getBinding("items");

            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter("Category", FilterOperator.StartsWith, sValue));
            }
            oBinding.filter(aFilters);
        },
       

    });
});

