/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2021-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published 
 by the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
 




/**
 * Reference search (in a popup window). 
 */

pol.tracking.PointInfo = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.srv = CONFIG.server;
        
        t.classname = "tracking.PointInfo"; 
        t.domclass = "infopopup";
        t.info = null;

        var _default = {
            view: () => {
                return m("div", "DEFAULT");
            }
        }
        
        
        var movement = {
            view: vn => {
                if (vn.attrs.speed <= 0 || vn.attrs.course < 0)
                    return null;
                
                const crs = vn.attrs.course;
                if (crs > 22 && crs <= 67)
                    return m("span", m("img", {src:"images/16px/dNE.png"}), " NE"); 
                if (crs > 67 && crs <= 112)
                    return m("span", m("img", {src:"images/16px/dE.png"}), " E");
                if (crs > 112 && crs <= 157)
                    return m("span", m("img", {src:"images/16px/dSE.png"}), " SE");
                if (crs > 157 && crs <= 202)
                    return m("span", m("img", {src:"images/16px/dS.png"}), " S");
                if (crs > 202 && crs <= 247)
                    return m("span", m("img", {src:"images/16px/dSW.png"}), " SW");
                if (crs > 247 && crs <= 292)
                    return m("span", m("img", {src:"images/16px/dW.png"}), " W");
                if (crs > 292 && crs <= 337)
                    return m("span", m("img", {src:"images/16px/dNW.png"}), " W");
                else
                    return m("span", m("img", {src:"images/16px/dN.png"}), " N");
            }
        }
        
        var traffic = {
            view: vn => {
                const tr = vn.attrs.traf; 
                return m("div.trblock", tr.map( x => 
                    m("span.link_id", {onclick: y=>findItem(x) }, x+" " )));
            }
        }
        
        
        var _pointident = {
            view: () => {
                const x = t.info;
                return [
                    m("div.field",
                        m("span.leftlab", "Ident: "), m("b", x.ident)), 
                    (x.alias != null ? 
                        m("div.field",
                            m("span.leftlab", "Alias: "), m("b", x.alias)) : null)
                ]
            }
        }
        
        
        var _posinfo = {
            view: () => {
                const x = t.info;
                return [
                    m("div.field", m("nobr", 
                        m("span.leftlab", "Position (UTM): "), m.trust(pol.mapref.formatUTM(x.pos)))), 
                    m("div.field", m("nobr", 
                        m("span.leftlab", "Position (latlong): "), m.trust(pol.mapref.formatDM(x.pos)))),         
                    (x.altitude > 0 ? 
                        m("div.field", 
                          m("span.leftlab", "Altitude: "), x.altitude+" m") : null),
                ]
            }
        }
        
        
        var _pointinfo = {
            view: () => {
                const x = t.info;
                return [
                    (x.descr != null && x.descr != "" ? 
                        m("div.field", m("nobr", 
                            m("span.leftlab", "Description: "), x.descr)) : null),
                    m(_posinfo),
                    m("div.field", 
                        m("span.leftlab", "Last reported: "), formatDTG(x.updated)),  
                       
                ]
            }
        }
        
        /* Generic tracker point */
        var _trackerpoint = {
            view: () => {
                return [
                    m(_pointident),
                    m(_pointinfo)
                ]
            }
        }
                    
        /* Generic APRS point */
        var _aprspoint = {
            view: () => {
                const x = t.info;
                return [
                    m(_pointident),
                    m("div.field", 
                        m("span.leftlab", "Channel: "), x.source), 
                    m("div.field", 
                        m("span.leftlab", "APRS Symbol: "), x.symtab +" "+ x.symbol),                                
                    m(_pointinfo),
                         
                    (x.speed > 0 ? m("div.field", 
                            m("span.leftlab", "Movement: "), 
                                m(movement, {course:x.course, speed:x.speed})) : null),
                ]
            }
        }
        
        /* AIS Vessel */
        var _aisvessel = {
            view: () => {
                const x = t.info;
                return [
                    m(_pointident),
                    m("div.field", 
                        m("span.leftlab", "Callsign: "), x.callsign), 
                    m("div.field", 
                        m("span.leftlab", "Name: "), x.name), 
                    m("div.field", 
                        m("span.leftlab", "Type: "), x.vtype),
                    m("div.field", 
                        m("span.leftlab", "Navstatus: "), x.navstatus),
                    m(_posinfo),
                                        
                    (x.speed > 0 ? m("div.field", 
                            m("span.leftlab", "Movement: "), [
                                Math.round(x.speed * 0.539956) + " knots ", nbsp, 
                                m(movement, {course:x.course, speed:x.speed})]) : null),   
                ]
            }
        }
        
        
        var _datexsit = {
            view: () => {
                const x = t.info;
                return [
                    m("div.field", 
                        m("span.leftlab", "Type-Road: "), x.sitType, " : ",x.roadNr),
                    m("div.field", 
                        m("span.leftlab", "Severity: "), x.severity),
                    m("div.field", 
                        m("span.leftlab", "Valid time span: "), m("span.nobr", formatDTG(x.startTime)), nbsp, "-", nbsp, formatDTG(x.endTime)), 
                    m("div.datexcom", x.comments[0]), 
                    m("div.datexcom", x.comments[1]),
                ]
            }
        }
        
        
        
        /* APRS station */
        var _station = {
            view: () => {
                const x = t.info;
                return [
                    m(_aprspoint),
                    (x.path != null ? 
                       m("div.field", 
                           m("span.leftlab", "Via: "), cleanPath(x.path)) : null), 
                    
                    m("div.traffic", [
                        (x.trafficTo != null && x.trafficTo.length > 0 ? m("div.field", 
                            m("span.leftlab", "Traffic to: "), m(traffic, {traf: x.trafficTo})) : null), 
                        (x.trafficTo != null && x.trafficFrom.length > 0 ? m("div.field", 
                            m("span.leftlab", "Traffic from: "), m(traffic, {traf: x.trafficFrom})) : null),
                    ])
                ]
            }
        }
        
        
        this.widget = {
            view: function() {
                if (t.info==null) return "waiting..";
                if (t.info.type=="Station") return m(_station);
                if (t.info.type=="AprsObject") return m(_aprspoint);
                if (t.info.type=="AisVessel") return m(_aisvessel);
                if (t.info.type=="DatexSitRecord") return m(_datexsit);
                else return m(_trackerpoint);
            }
        };
        
        
        function formatTime(dt) {
            const d = new Date(dt);
            return "" +
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
        }
        
        
        function cleanPath(str) {
            if (str==null)
                return "";
            return str.replaceAll(/qA.\,?/ig, "")
                    .replaceAll(/(WIDE|SAR)[0-9](\-[0-9])?\,?/ig, "")
                    .replaceAll("*", "")
                    .replaceAll(/\,+/ig, ",")
                    .replaceAll(",", ", ");
        }
        
        
        
    } /* constructor */
    
    
    getItem(id) {
        m.redraw();
        const svc = (CONFIG.server.isAuth() ? "xinfo" : "info");
        this.srv.GET("item/"+id+"/"+svc, null, 
            x  => { 
                this.info = JSON.parse(x); 
                m.redraw()
            },
            () => {
                console.warn("Item not found"); 
            }
        );
    }
    
    onActivate() { 
        this.info = null;
    }
    
} /* class */



pol.widget.setFactory( "tracking.PointInfo", {
        create: () => new pol.tracking.PointInfo()
    });  
