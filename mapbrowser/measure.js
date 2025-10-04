/*
   Map browser based on OpenLayers 5.
   Copyright (C) 2017-2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
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


pol.core.Measure = class {

    constructor() {
        const t = this;
        let tooltipElement;
        let tooltip;
        let listener;
        let sketch;
        t.tooltips = [];


        t.vector = CONFIG.mb.addVectorLayer(
           new ol.style.Style({
              fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
              }),
              stroke: new ol.style.Stroke({
                color: '#d11',
                width: 2
              })
            }));


        t.draw = new ol.interaction.Draw({
           source: t.vector.getSource(),
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

        CONFIG.mb.map.addInteraction(t.draw);


        t.draw.on("drawstart",  evt => {
            sketch = evt.feature;

            listener = sketch.getGeometry().on('change', evt => {
               const tooltipCoord = evt.target.getLastCoordinate();
               tooltipElement.innerHTML = formatLength(evt.target);
               tooltip.setPosition(tooltipCoord);
            });
        }, t);


        t.draw.on("drawend", () => {
           tooltipElement.className = 'tooltip tooltip-static';
           tooltip.setOffset([0, -7]);
           // unset sketch
           sketch = null;
           // unset tooltip so that a new one can be created
           tooltipElement = null;
           t.tooltips.push(createTooltip());
           ol.Observable.unByKey(listener);
        }, t);



        t.tooltips.push(createTooltip());


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


        function bearing(c1, c2) {
            var cr1 = toRadians(c1[1]), cr2 = toRadians(c2[1]);
            var d = toRadians(c2[0]-c1[0]);
            var y = Math.sin(d) * Math.cos(cr2);
            var x = Math.cos(cr1)*Math.sin(cr2) -
                Math.sin(cr1) * Math.cos(cr2) * Math.cos(d);
            var brng = Math.atan2(y, x);
            return (toDegrees(brng) + 360) % 360;
        }


        // Converts from degrees to radians.
        function toRadians(degrees) {
            return degrees * Math.PI / 180;
        }


        // Converts from radians to degrees.
        function toDegrees(radians) {
            return radians * 180 / Math.PI;
        }

        function formatLength(line) {
            const coordinates = line.getCoordinates();
            const sourceProj = CONFIG.mb.view.getProjection();
            let length = 0;
            let c1=0, c2=0;
            for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                length += ol.sphere.getDistance(c1, c2);
            }

            let brng = bearing(c1, c2);


            let output = "";
            if (length > 100) {
                output = (Math.round(length / 1000 * 100) / 100) +
                    ' ' + 'km';
            } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
            }
            output += " &nbsp"+Math.round(brng*10)/10+"\u00B0";
            return output;
        };
    } /* constructor */





    deactivate(a) {
       this.draw.setActive(false);
       CONFIG.mb.map.removeInteraction(this.draw);
       CONFIG.mb.removeLayer(this.vector);
       for (const x of this.tooltips)
          CONFIG.mb.map.removeOverlay(x);
    }


} /* class */
























