/*
   Map browser based on OpenLayers 4. 
   Copyright (C) 2017 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
   AGPL licenced. 
   ----
   
   This source file is based on OpenLayers examples: 
   http://openlayers.org/en/latest/examples/measure.html 
   Copyright 2005-present OpenLayers Contributors. All rights reserved.
   
   Redistribution and use in source and binary forms, with or without modification,
   are permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation and/or
      other materials provided with the distribution.

   THIS SOFTWARE IS PROVIDED BY OPENLAYERS CONTRIBUTORS ``AS IS'' AND ANY EXPRESS
   OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
   MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
   SHALL COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
   INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
   LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
   OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
   ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

   The views and conclusions contained in the software and documentation are those
   of the authors and should not be interpreted as representing official policies,
   either expressed or implied, of OpenLayers Contributors.
 */


polaric.Measure = function() 
{
    
    this.vector = browser.addVectorLayer(
       new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new ol.style.Stroke({
            color: '#d11',
            width: 2
          })
        }));
    
    
    this.draw = new ol.interaction.Draw({
       source: this.vector.getSource(),
       type: "LineString",
       style: new ol.style.Style({
            fill: new ol.style.Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 250, 0.6)',
              lineDash: [7, 8],
              width: 2
            }),
            image: new ol.style.Circle({
              radius: 5,
              stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.7)'
              }),
              fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
              })
            })
          })
    });
          
    var tooltipElement;
    var tooltip;
    var listener;
    this.tooltips = [];
    
    CONFIG.mb.map.addInteraction(this.draw);
    
    
    this.draw.on("drawstart",  function(evt) {
        sketch = evt.feature;
        var tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function(evt) {
           var geom = evt.target;
           var output = formatLength(geom);
           tooltipCoord = geom.getLastCoordinate();
           tooltipElement.innerHTML = output;
           tooltip.setPosition(tooltipCoord);
        });
    }, this);

    
    this.draw.on("drawend", function() {
       tooltipElement.className = 'tooltip tooltip-static';
       tooltip.setOffset([0, -7]);
       // unset sketch
       sketch = null;
       // unset tooltip so that a new one can be created
       tooltipElement = null;
       this.tooltips.push(createTooltip());
       ol.Observable.unByKey(listener);
    }, this);


    
    this.tooltips.push(createTooltip());
    

    function createTooltip() {
       if (tooltipElement) {
          tooltipElement.parentNode.removeChild(measureTooltipElement);
       }
       tooltipElement = document.createElement('div');
       tooltipElement.className = 'tooltip tooltip-measure';
       tooltip = new ol.Overlay({
          element: tooltipElement,
          offset: [0, -15],
          positioning: 'bottom-center'
       });
       CONFIG.mb.map.addOverlay(tooltip);
       return tooltip;
    }
    
    
    var wgs84Sphere = new ol.Sphere(6378137);
    
    function formatLength(line) {
        var length;

          var coordinates = line.getCoordinates();
          length = 0;
          var sourceProj = CONFIG.mb.view.getProjection();
          for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
            var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
            var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
            length += wgs84Sphere.haversineDistance(c1, c2);
          }

        var output;
        if (length > 100) {
          output = (Math.round(length / 1000 * 100) / 100) +
              ' ' + 'km';
        } else {
          output = (Math.round(length * 100) / 100) +
              ' ' + 'm';
        }
        return output;
      };
 
}





polaric.Measure.prototype.deactivate = function(a) {
   this.draw.setActive(false);
   CONFIG.mb.map.removeInteraction(this.draw);
   CONFIG.mb.removeLayer(this.vector);
   for (i in this.tooltips)
     CONFIG.mb.map.removeOverlay(this.tooltips[i]);
}
