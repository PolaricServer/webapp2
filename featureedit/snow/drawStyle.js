/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

var snow = window.snow;

//Sets the current style to the selected color.
snow.setStyleColor = function(colorVal)
{
    let st = snow.currentStyle
    if (st==null)
        st = snow.getStyle(colorVal.fill)
    else
        st = st.clone();
    
    st.getStroke().setColor(colorVal.fill);
    if (colorVal.stroke != null) 
        st.getStroke().setColor(colorVal.stroke);
    if (st.getFill())
        st.getFill().setColor(colorVal.fill + snow.hexOpacity );
    st.getText().getFill().setColor(colorVal.fill)
    ;
    snow.currentStyle = st;
}


// Set the current style with dashed line
snow.setStyleDashed = function(on)
{
    let st = snow.currentStyle
    if (st==null)
        st = snow.getStyle(hexBlack)
    else
        st = st.clone();
    st.getStroke().setLineDash(on? [3.5, 4] : [0,0]);
    snow.currentStyle = st;
}


// Set the current style with thinner line
snow.setStyleThin = function(on)
{
    let st = snow.currentStyle
    if (st==null)
        st = snow.getStyle(hexBlack)
    else
        st = st.clone();
    st.getStroke().setWidth((on? 1.1 : 2.1));
    snow.currentStyle = st;
}



snow.setStyleFilled = function(on)
{
    let st = snow.currentStyle
    if (st==null)
        st = snow.getStyle(hexBlack)
    else
        st = st.clone();

    st.setFill(
        (on? new Fill({ color: st.getStroke().getColor() + snow.hexOpacity }) : null)
    )
    snow.currentStyle = st;
}


   
//Returns a style with a certain color.
snow.getStyle = function(colorVal)
{
    let st = new Style(
    {
        stroke: new Stroke(
        {
            color: colorVal,
            width: 2.1
        }),
        fill: new Fill(
            { color: colorVal + snow.hexOpacity }),
            
        text: new ol.style.Text(
            { fill: new Fill({color: colorVal}),
              stroke: new Stroke( {width: 2.5, color: "#fff"} ), 
              scale: 1.0
            }
        )
    })
    return st
}


//Initial color settings.
snow.setStyleColor(snow.hexColor[0])


//Style for selecting features.
snow.selectStyle = new Style(
{
    stroke: new Stroke(
    {
        color: snow.hexSelectStroke,
        width: '3.5',
        lineDash: [4,5]
    }),
    fill: new Fill(
        { color: snow.hexSelectFill + snow.hexOpacity })
})


//Toggles orange border on deleteLayer when clicking and removes it on mouseleave.
snow.deleteHighlightHandler = function() 
{
    $('#deleteLayer').mousedown( () => 
    { $('#deleteLayer').addClass("selectedFunction") }).mouseup( () => 
    { $('#deleteLayer').removeClass("selectedFunction") }).mouseleave( () => 
    { $('#deleteLayer').removeClass("selectedFunction") })
}
