


var pol = window.pol;
pol.core.Measure = class {

    constructor() {
        const t = this;
        let tooltipElement;
        let tooltip;
        let listener;
        let sketch;
        t.tooltips = [];

        t.coordinates = [];
        t.points = [];
        t.length = 0;
        
        
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

            t.coordinates = [];
            t.points = [];
            t.length = 0;
            
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
           const tt = createTooltip(t.coordinates, t.length);
           t.tooltips.push(tt);
           ol.Observable.unByKey(listener);
           
           profile(); 
        }, t);



        t.tooltips.push(createTooltip());

        
        
        
        function profile() {
          t.points = [];
          let dist = Math.round(t.length / 500);
          if (dist < 2)
            dist = 2;

          const sourceProj = CONFIG.mb.view.getProjection();
          for (let i = 0, ii = t.coordinates.length - 1; i < ii; ++i) {
            const c1 = ol.proj.transform(t.coordinates[i], sourceProj, 'EPSG:4326');
            const c2 = ol.proj.transform(t.coordinates[i + 1], sourceProj, 'EPSG:4326');
            t.points = [...t.points, ...CONFIG.mb.line2points(c1, c2, dist)];
          }
          
          let w = getWIDGET("tracking.HeightProf");
          if (w != null && w.isActive())
            w.showData(t.points, dist);
        }
        
        
        function highLightTooltip(element) {
   //       element.style += "background: red";
        }
        
        

        function createTooltip(coord, length) {
          if (tooltipElement) {
            tooltipElement.parentNode.removeChild(measureTooltipElement);
          }
          tooltipElement = document.createElement('div');
          tooltipElement.className = 'tooltip tooltip-measure';
          tooltipElement.id = "MeasureTooltip";
           
          const tt = new ol.Overlay({
              element: tooltipElement,
              offset: [0, -15],
              positioning: 'bottom-center'
          });
          tt._coord = coord;
          tt._length = length;
          
          /* Mouse event handlers */
          tooltipElement.onclick = function(e) {
            highLightTooltip(tt.element);
            t.coordinates = tt._coord;
            t.length = tt._length;
            console.log(tt);
            profile();
            e.stopPropagation();
          }
          
          CONFIG.mb.map.addOverlay(tt);
          tooltip = tt;
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
            t.coordinates = coordinates;
            const sourceProj = CONFIG.mb.view.getProjection();
            let length = 0;
            let c1=0, c2=0;
            for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                length += ol.sphere.getDistance(c1, c2);
            }
            t.length = length;
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























