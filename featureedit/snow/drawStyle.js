/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

//Sets the current style to the selected color.
snow.setStyleColor = function(colorVal)
{
//    snow.currentStyle = snow.getStyle(colorVal)

    let st = snow.currentStyle
    if (st==null)
        st = snow.getStyle(colorVal)
    else
        st = st.clone();
    st.getStroke().setColor(colorVal)
    if (st.getFill())
        st.getFill().setColor(colorVal + hexOpacity )
    st.getText().getFill().setColor(colorVal);
    snow.currentStyle = st;
}


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
        (on? new Fill({ color: st.getStroke().getColor() + hexOpacity }) : null)
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
            { color: colorVal + hexOpacity }),
            
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
snow.setStyleColor(hexBlack)


//Style for selecting features.
snow.selectStyle = new Style(
{
    stroke: new Stroke(
    {
        color: hexSelectStroke,
        width: '3.5',
        lineDash: [4,5]
    }),
    fill: new Fill(
        { color: hexSelectFill + hexOpacity })
})


//Toggles orange border on deleteLayer when clicking and removes it on mouseleave.
snow.deleteHighlightHandler = function() 
{
    $('#deleteLayer').mousedown( () => 
    { $('#deleteLayer').addClass("selectedFunction") }).mouseup( () => 
    { $('#deleteLayer').removeClass("selectedFunction") }).mouseleave( () => 
    { $('#deleteLayer').removeClass("selectedFunction") })
}
