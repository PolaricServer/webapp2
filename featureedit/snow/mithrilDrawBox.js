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
                m("div", [
                m("div.igroup", [
                m("label", 
                {"class":"non-interactive"}, 
                ["Draw type: ", m.trust("&nbsp;")]),
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
                ])
                ]),
              
                m("div.igroup", [
                m("label", 
                {"class":"non-interactive"}, 
                ["Style: ", m.trust("&nbsp;")]),
                m("div", 
                [                    
                    m("img", 
                    {
                        "src":"images/drawIcons/line_thin.png", 
                        "id":"thinstyle", "class":"drawIcon", 
                        onclick: snow.thinstyle_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/line_dashed.png", 
                        "id":"dashedstyle", "class":"drawIcon", 
                        onclick: snow.dashedstyle_click
                    }),
                    m("img", 
                    {
                        "src":"images/drawIcons/polygon_filled.png", 
                        "id":"filledstyle", "class":"drawIcon", 
                        onclick: snow.filledstyle_click
                    }),
                ])
                ])
                ]),
              
                //Color Selection
                m("label", 
                {"class":"non-interactive"},
                [
                        "Color Selector: ", m.trust("&nbsp;"),
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
                ["Functions: ", m.trust("&nbsp;")]),
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
        ])   
    }
}
