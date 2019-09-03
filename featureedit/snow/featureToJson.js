/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim.
 * All rights reserved. See LICENSE for more detail.  
 * */ 




 //writes all selected features to json
snow.__featuresToJSON = function()
{
    if ( snow.selectedFeatures[0] )
    {
        let json = '{ "objects" : ['
        let first = true
        snow.selectedFeatures.forEach( (f) => 
        {  
            if( first )
            { first = false }
            else
            { json += ',' }
            let originalStyle = null
            snow.originalStyles.forEach(function(e)
            {
                if( f.ol_uid == e.ol_uid )
                { originalStyle = e.style.getStroke().getColor() }
            })
            if( originalStyle )
            {
                json += '{"style" : "' + originalStyle + '", "drawObj":'
                json += JSON.stringify(snow.GetGeoJSONFromFeature(f))
                json += '}'
            } 
            else 
            { console.log("error: No Style Set") }
        })
        json += ']}';
        console.log(json)
        parsedJSON = JSON.parse(json)
        console.log(json)
        return parsedJSON
    }  
}




//gets the GeoJSON from a feature
snow.GetGeoJSONFromFeature = function(feature) 
{
    const jsf = new jsonFormat(); 
    //converts a circle to a Polygon
    if ( feature.getGeometry().getType() == "Circle" ) 
    {  
        const circle = feature.getGeometry()
        feature.setGeometry(PolygonGeom.fromCircle(circle))
    } 
    var geoJSON = jsf.writeFeatureObject(feature); 
    return geoJSON;
}


// return features from a layer
snow.GetFeaturesFromLayer = function(layer)
{
    var source = layer.getSource()
    var feature = source.getFeatures()
    return feature;
}


//function to read incoming json
snow.readJSON = function(jsonArray)
{
    jsonArray.objects.forEach( (obj) =>
    {
        snow.drawFeatureToMap(obj)
    })
}


//takes in an jsonObject and writes it to the map
snow.drawFeatureToMap = function(jsonObject) 
{
    let featureStyle = getStyle(jsonObject.style)
    let featureObject = jsonObject.drawObj    
    let feature = jsonFormat.readFeature(featureObject)
    feature.setStyle(featureStyle)
    snow.drawSource.addFeature(feature)
}


//Sample JSON test object
snow.createJSONTestObject = function()
{
    let jsonTestString = '' + 
    '{"style" : "#000000", "drawObj":'+
    '{"type":"Feature","geometry":'+
    '{"type":"Polygon","coordinates":'+
    '[[[1540970.4902291533,8782308.80185361],[1506726.7015573943,8770078.877327982],[1489604.8072215149,8757848.952802354],'+
    '[1479820.8676010123,8728497.133940846],[1482266.852506138,8706483.269794716],[1514064.6562727713,8667347.511312705],'+
    '[1543416.475134279,8642887.662261449],[1572768.2939957867,8630657.737735821],[1619242.0071931737,8623319.783020444],'+
    '[1651039.8109598071,8623319.783020444],[1682837.6147264405,8637995.692451198],[1695067.5392520686,8655117.586787077],'+
    '[1702405.4939674458,8667347.511312705],[1540970.4902291533,8782308.80185361]]]},"properties":null}}'
    return JSON.parse(jsonTestString)
}
