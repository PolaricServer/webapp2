/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim.
 * All rights reserved. See LICENSE for more detail.  
 * */ 

 //writes all selected features to json
function featuresToJSON()
{
    if ( selectedFeatures[0] )
    {
        let json = '{ "objects" : ['
        let first = true
        selectedFeatures.forEach( (f) => 
        {  
            if( first )
            { first = false }
            else
            { json += ',' }
            let originalStyle = null
            originalStyles.forEach(function(e)
            {
                if( f.ol_uid == e.ol_uid )
                { originalStyle = e.style.getStroke().getColor() }
            })
            if( originalStyle )
            {
                json += '{"style" : "' + originalStyle + '", "drawObj":'
                json += JSON.stringify(GetGeoJSONFromFeature(f))
                json += '}'
            } 
            else 
            { console.log("error: No Style Set") }
        })
        json += ']}'
        console.log(json)
        parsedJSON = JSON.parse(json)
        console.log(json)
        return parsedJSON
    }  
}

//gets the GeoJSON from a feature
function GetGeoJSONFromFeature(feature) 
{
    //converts a circle to a Polygon
    if ( feature.getGeometry().getType() == "Circle" ) 
    {  
        const circle = feature.getGeometry()
        feature.setGeometry(PolygonGeom.fromCircle(circle))
    }
    var geoJSON = jsonFormat.writeFeatureObject(feature); 
    return geoJSON;
}


// return features from a layer
function GetFeaturesFromLayer(layer)
{
    var source = layer.getSource()
    var feature = source.getFeatures()
    return feature;
}

//function to read incoming json
function readJSON(jsonArray)
{
    jsonArray.objects.forEach( (obj) =>
    {
        drawFeatureToMap(obj)
    })
}

//takes in an jsonObject and writes it to the map
function drawFeatureToMap(jsonObject) 
{


    let featureStyle = getStyle(jsonObject.style)
    let featureObject = jsonObject.drawObj    
    let feature = jsonFormat.readFeature(featureObject)
    feature.setStyle(featureStyle)
    drawSource.addFeature(feature)
}

//Sample JSON test object
function createJSONTestObject()
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