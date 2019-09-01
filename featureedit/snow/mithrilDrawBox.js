/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

//Defines the main div of drawModule.
snow.drawPopup = 
{
    view: function() 
    {
        return m("div", 
        [
            m("div", 
            {"class":"drawTab"}, 
            [
                m("p", 
                {
                    "id":"drawTab", 
                    "class":"selectedTab", 
                    "title":"Tab for showing marking functions",
                    onclick:showDrawbox_click
                }, "Draw"),
                m("p", 
                {
                    "id":"iconTab", 
                    "title":"Tab for placing icons on the map",
                    onclick:showIconbox_click
                }, "Icon")
            ]),
            m("h1", 
            {
                "id":"drawPopupTitle", 
                "class":"ui-draggable-handle"
            }, "Draw Tools"),
            //Container divs to mount drawTools and iconTools.
            m("div",
            {"id":"drawBox"}),
            m("div", 
            {"id":"iconBox"}),
        ])
    }
}

//Defines user interface for draw funtionality.
snow.drawTools = 
{
    view: function() 
    {
        return m("div", 
        {"id":"drawtools"},
        [   
            m("img", 
            {
                "src":"images/drawIcons/questionmark_48px.png", 
                "id":"tooltip", 
                "title":"Tooltip Helper, click and mouseover other functions", 
                onclick:snow.tooltip_click
            }),
            m("div",
            [   
                m("label", 
                {"class":"non-interactive"}, 
                ["Draw type ", m.trust("&nbsp;")]),
                //Draw Types
                m("div", 
                [
                    m("img", 
                    {
                        "src":"images/drawIcons/straightline_50px.png", 
                        "id":"straight", "class":"drawIcon", 
                        onclick: snow.straight_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/wigglyline_50px.png", 
                        "id":"freehand", "class":"drawIcon", 
                        onclick: snow.freehand_click
                    }),
                ]),
            
                //Geometry Selection
                m("label", 
                {"class":"non-interactive"},
                ["Geometry type ", m.trust("&nbsp;"),]),
                m("div", 
                {
                    "id":"selectingType", 
                    "class":"dropdownSelect"
                }, [
                    m("p", 
                    {
                        "id":"optPolygon", 
                        "class":"dropdownOption", 
                        onclick: snow.setCurrentType_click
                    }, "Polygon"),
                    m("p", 
                    {
                        "id":"optLine", 
                        "class":"dropdownOption", 
                        onclick: snow.setCurrentType_click
                    }, "LineString"),
                    m("p", 
                    {
                        "id":"optCircle", 
                        "class":"dropdownOption", 
                        onclick: snow.setCurrentType_click
                    }, "Circle"),
                ]),
                m("div", 
                {
                    "id":"type", 
                    "class":"dropdownSelect"
                }, 
                [
                    m("p", 
                    {
                        "id":"currentType",
                        onclick:snow.showDropdownOptions_click }, 
                        "Polygon"),
                ]),
                
                //Color Selection
                m("label", 
                {"class":"non-interactive"},
                [
                        "Color Selector ", m.trust("&nbsp;"),
                ]),        
                m("div", 
                {"id":"ColorSelecter"},
                [
                    m("span", 
                    {
                        "class":"colorOption selectedColor",
                        "id":"selectBlack", 
                        onclick:snow.colorOption_click
                    }),
                    m("span", 
                    {
                        "class":"colorOption",
                        "id":"selectRed", 
                        onclick:snow.colorOption_click
                    }),
                    m("span", 
                    {
                        "class":"colorOption",
                        "id":"selectOrange", 
                        onclick:snow.colorOption_click
                    }),
                    m("span", 
                    {
                        "class":"colorOption",
                        "id":"selectYellow", 
                        onclick:snow.colorOption_click
                    }),
                    m("span", 
                    {
                        "class":"colorOption",
                        "id":"selectGreen", 
                        onclick:snow.colorOption_click
                    }),
                    m("span", 
                    {
                        "class":"colorOption",
                        "id":"selectBlue", 
                        onclick:snow.colorOption_click
                    }),
                    m("span", 
                    {
                        "class":"colorOption",
                        "id":"selectPurple", 
                        onclick:snow.colorOption_click
                    }),
                    
                ]),

                //Draw Functions
                m("label", 
                {"class":"non-interactive"},
                ["Functions ", m.trust("&nbsp;")]),
                m("div",
                [
                    m("img", 
                    {
                        "src":"images/drawIcons/draw_128px.png", 
                        "id":"drawToggle", "class":"drawIcon", 
                        onclick:snow.drawToggle_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/edit_50px.png", 
                        "id":"modifyToggle", "class":"drawIcon", 
                        onclick: snow.modifyToggle_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/trashCan_50px.png",   
                        "id":"deleteLayer", "class":"drawIcon", 
                        onclick:snow.deleteLayer_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/snap_50px.png", 
                        "id":"snapToggle", "class":"drawIcon", 
                        onclick: snow.snapToggle_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/km2_50px.png", 
                        "id":"printMetric", "class":"drawIcon", 
                        onclick: snow.toggleMetric_click
                    }),
                   // m("img", {"src":"images/download","id":"downloadGPX", "class" : "drawIcon"}),
                ]),
            ]),
            //TODO:REMOVE?
            // m("div",
            // [
            //     // m("button", {"id":"printMetric", "class" : "drawButton"}, "Print Area"),m
            //     m("p", {"id":"showMetrics", "class":"non-interactive"}, "Areal")m
            // ]),
            // m("div",
            // [
            // m("button", {"id":"writeJSON", "class" : "drawButton"}, "Write JSON"),
            // m("button", {"id":"readJSON", "class" : "drawButton"}, "Read JSON"),
            //     m("button", {"id":"undoChange", "class":"drawButton"}, "Undo"),
            //     m("button", {"id":"redoChange", "class":"drawButton"}, "Redo"),
            //     m("button", {"id":"logGPX",     "class":"drawButton"}, "log gpx"),
            //     m("button", {"id":"logKML",     "class":"drawButton"}, "log kml")
            // ]),
            // m("div", {"id":"","class":"downloadFiles"},
            // [
            //     m("button", {"id":"", "class":"drawButton"}, "Draw new Path"),
            //     m("input",  {"id":"fileNameGpxDownload", "type":"text", "value":"path.gpx"}),
            //     m("button", {"id":"downloadGPX", "class":"drawButton"}, "Download GPX")
            // ])
        ])   
    }
}
