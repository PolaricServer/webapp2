/*
 Map browser based on OpenLayers 5. 
 Misc. common functions and mithril modules for UI via DOM. 
 
 
 Copyright (C) 2017-2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Autojump between two fields.
 * @param {string} fieldId - Id of DOM field elelent to jump from.
 * @param {string} nextFieldId - Id of DOM field element to jump to.
 */
pol.ui.autojump = function(fieldId, nextFieldId)
{
    if (fieldId==null || nextFieldId==null) {
        console.error("Field id is null");
        return;
    }
   
    let beforeLength = 0;
    let downStrokeField = null;
    const myField = document.getElementById(fieldId);             
    myField.nextField=document.getElementById(nextFieldId); 
    myField.onkeydown=autojump_keyDown;
    myField.onkeyup=autojump_keyUp;


    function autojump_keyDown()
    {
        beforeLength=myField.value.length;
        downStrokeField=myField;
    }


    function autojump_keyUp()
    {     
        if (
            (myField == downStrokeField) && 
            (myField.value.length > beforeLength) && 
            (myField.value.length >= myField.maxLength)
        ) 
            myField.nextField.focus();
        downStrokeField=null;
   }
}
/* End of autojump stuff */



/* Some simple DOM elements */
const br = m("br");
const hr = m("hr");
const nbsp = m.trust("&nbsp;");



/**
 * Input field with default values and syntax checking. 
 * @param {string} id - DOM element identifier. 
 * @param {number} size - size of field. 
 * @param {number} maxlength - max length of field.
 * @param {boolean} contentEditable - true if field can be edited by user. 
 * @param {regex} regex - Regular expression that defines what input is valid. 
 * @param {boolean} passwd - optional. true if password
 */
const textInput = {
 
    view: function(vn) {
        var t = this;
        var type = (!vn.attrs.passwd || vn.attrs.passwd==false ? "text" : "password");
 
        return m("input#"+vn.attrs.id, 
        { type: type, list: vn.attrs.list, config: vn.attrs.config, size: vn.attrs.size, maxLength: vn.attrs.maxLength, 
          contentEditable: (vn.attrs.contentEditable ? vn.attrs.contentEditable : true),
                
            oninput: function(ev) {
                vn.attrs.value(ev.target.value); 
                if (!vn.attrs.regex) 
                    return;                
                if (vn.attrs.regex.test(ev.target.value)) {
                    vn.state.cssclass = "valid";
                    vn.dom.title = "Input OK";
                    $(vn.dom).attr("ok", true);
                }
                else {
                    vn.state.cssclass = "invalid";
                    vn.dom.title = "Invalid input!";
                    $(vn.dom).attr("ok", false);
                }    
            },
            onchange: function(ev) {
                vn.attrs.value(ev.target.value);
                t.cssclass = "";
                if (vn.attrs.onchange !=null)
                    vn.attrs.onchange();
            },
            
            value: vn.attrs.value(),
            className: (t.cssclass ? t.cssclass : "")
        });
   }
}




/**
 *  Checkbox 
 *  Attributes: id, onclick, name, checked
 */
const checkBox = {
    view: function(vn) {
        return m("span.nobr", {title: vn.attrs.title}, 
            m("input#" + vn.attrs.id, 
         {
            onclick: vn.attrs.onclick,
            type:"checkbox", name: vn.attrs.name, value: vn.attrs.id, 
            checked: (vn.attrs.checked ? "checked" : null),
            onchange: (vn.attrs.onchange)
         }), nbsp, vn.children);
    }
}



/**
 * Select box 
 * Attributes: 
 *  - id - id for div element
 *  - onchange - function to invoke when change happens
 *  - list - list of options (val and label)
 */ 
const select = {
    view: function(vn) {
        return m("select#"+vn.attrs.id, {onchange: vn.attrs.onchange}, vn.attrs.list.map(
            x => m("option", {value: x.val, style: x.style}, x.label) ));
    }
}



/*
 * Icon picker
 * Attributes: 
 *  - id - id for div element (optional)
 *  - icons - array of image file names.
 *  - default - index (in icons array) of icon to be selected by default. (optional) 
 */
const iconPick = {
    oncreate: function(vn) {
        const inp = vn.state;
        inp.id=vn.attrs.id;     
    },    
    
    doSelect: function(vn, x) {
        vn.state.selected = x;
        $("div#iconlist").css("visibility", "hidden");
        $("div#iconlist").css("max-height", "1px");
        $("#iconpick").get(0).value = x;                 
    },
    
    showIcons: function() {
        $("div#iconlist").css("visibility", "visible");
        $("div#iconlist").css("max-height", "");
    },
    
    view: function(vn) {
        const icons = vn.attrs.icons; 
        const dfl = (vn.attrs.default ? vn.attrs.default : 0); 
        const xx = (vn.attrs.value && vn.attrs.value!=null ? vn.attrs.value : icons[dfl]);
        const yy = (vn.state.selected ? vn.state.selected : xx);
        
        setTimeout( ()=> {
            if (yy && $("#iconpick").get(0))
                $("#iconpick").get(0).value = yy
        }, 600);
        
        return m("span", [ 
            m("span#iconpick", { onclick:() => this.showIcons(), 
                onchange: ()=> { vn.state.selected = $("#iconpick>img").val()} }, 
                m("img", {src: yy} )), 
                 
            m("div#iconlist", {style: "max-height: 1px"}, icons.map( x=> {
                return m("img", { src: x, onclick: ()=> this.doSelect(vn, x) })
            }) 
        )])
    }
    
}


const Datepick = {
    oncreate: function(vn) {
        const input = document.createElement( 'input' );
        this.input = input;
        input.readOnly = true; 
        input.id=vn.attrs.id;
        input.value = vn.attrs.value; 
        vn.dom.appendChild( input );
        new Pikaday( {
            field: input,
            format: "YYYY-MM-DD"
        });
	},
    
    onupdate (vn) {
      this.input.value = vn.attrs.value;
    },
    
    onchange: function(vn) {
        vn.attrs.value = input.value; 
    },
    
    view: function(vn) {
        return m("span.datepick")
  }
}



/*
 * Value attributes: 
 *     dvalue - date value (stream)
 *     tvalue - time (stream) 
 */

const dateTime = {
    view: function(vn) {
        return m("span.datetime", 
            m(Datepick, {value: vn.attrs.tval.tdate, id:vn.attrs.id+"_date"}),
            m(textInput, {id:vn.attrs.id+"_time", size: "5", maxLength: "5", 
                value: vn.attrs.tval.ttime, regex: /^(([0-1][0-9])|(2[0-3]))\:[0-5][0-9]$/ }),
            m("img", {title: "Set time to now", src:"images/time.png", onclick: ()=> vn.attrs.tval.setNow()}));
    }
}


const timeButt = {
    view: function(vn) {
        const t = vn.attrs.tval;
        return m("span", 
            (vn.attrs.hour ? 
                m("button.tm_fw", {type: "button", 
                    title: "Go back 1 hour", onclick: ()=>t.decr_hour()}, 
                    m("img", {src:"images/fback.png", height: "22px"})) : null ),
             
            m("button.tm_fw", {type: "button", 
                    title: "Go back 1 minute", onclick: ()=>t.decr_minute()}, 
                    m("img", {src:"images/back.png", height: "22px"})),
                          
            m("button.tm_fw", {type: "button", 
                    title: "Go forward 1 minute", onclick: ()=>t.incr_minute()}, 
                    m("img", {src:"images/forward.png", height: "23px"})), 
            
            (vn.attrs.hour ? 
                m("button.tm_fw", {type: "button", 
                    title: "Go forward 1 hour", onclick: ()=>t.incr_hour()}, 
                    m("img", {src:"images/fforward.png", height: "22px"})) : null ),
        );
    }
}



/** 
 * MGRS input fields. 
 * FIXME: Only one at a time because of use if id attribute. OK? 
 */
const mgrsInput = class {
    constructor () {
        this.prefix = m.stream("");
        this.locx = m.stream("");
        this.locy = m.stream("");
        CONFIG.mb.map.on('moveend', ()=> {
            this.setPrefix();
            this.locx("");
            this.locy("");
        });
        this.setPrefix(); 
    }
    
    setPrefix() {
        const center = CONFIG.mb.getCenter();
        this.prefix(pol.mapref.MGRSprefix(center));
    }
    
    onupdate (vn) {
        const x = pol.mapref.parseMGRS(CONFIG.mb, this.prefix(), this.locx(), this.locy())
        if (vn.attrs) {
            vn.attrs.value[0] = x[0];
            vn.attrs.value[1] = x[1];
        }
    }
    
    
    view() {
        return m("span", 
               {onclick: function() { pol.ui.autojump("locx", "locy"); }},
            m(textInput, {id:"mgrsprefix", size: "5", maxLength: "5", 
               regex: /^[0-9]{2}[C-X][A-Z][A-V]$/i, value: this.prefix }), nbsp,
            m(textInput, {id:"locx", size: "3", maxLength: "3", value: this.locx, regex: /^[0-9]{3}$/ }),
            m(textInput, {id:"locy", size: "3", maxLength: "3", value: this.locy, regex: /^[0-9]{3}$/ }), nbsp 
            
        );
    }
 }
 
 
 
/**
 * UTM input fields.
 * FIXME: Only one at a time because of use if id attribute. OK? 
 */ 
const utmInput = class {
    
    constructor() {
        this.lngZone = m.stream("");
        this.latZone = m.stream("");
        this.lat = m.stream("");
        this.lng = m.stream("");
    }
    
    getFromModel (vn) {
        console.assert(vn.attrs.value && vn.attrs.value !=null && 
            Array.isArray(vn.attrs.value), "Model must be array [x,y]");
        
        if (this.pModel && vn.attrs.value[0]==this.pModel[0] && vn.attrs.value[1]==this.pModel[1]) {
            return; 
        }
        this.pModel = vn.attrs.value;
        const uref = ( this.validPoint(this.pModel) ? 
            pol.mapref.toUTM(this.pModel) : CONFIG.mb.getCenterUTM() );
        
        this.lngZone(uref.lngZone);
        this.latZone(uref.latZone);
        if (this.validPoint(this.pModel)) {
            this.lng(uref.lng);
            this.lat(uref.lat);
        } else {
            this.lng("");
            this.lat("");
        }
    }

    validPoint(x) 
        {return x[0]!=0 && x[1]!=0;}
        
    onupdate (vn) {
        const x = pol.mapref.parseUTM(this.lng(), this.lat(), this.latZone(), this.lngZone());
        vn.attrs.value[0]=x[0]; 
        vn.attrs.value[1]=x[1];
        
    }

    
    view (vn) {
        const t = this;
        this.getFromModel(vn);
        return m("span", 
                 { onclick: function() {     
                     pol.ui.autojump('utmz', 'utmnz');
                     pol.ui.autojump('utmnz', 'utmx');
                     pol.ui.autojump('utmx', 'utmy');
                 }},
            m(textInput, {id:"utmz", size: "2", maxLength: "2", value: t.lngZone, regex:/^[0-9]{2}$/}), 
            m(textInput, {id:"utmnz", size: "1", maxLength: "1", value: t.latZone, 
                 contentEditable: false}), nbsp, nbsp,
            m(textInput, {id:"utmx", size: "6", maxLength: "6", value: t.lng, regex:/^[0-9]{6}$/}),
            m(textInput, {id:"utmy", size: "7", maxLength: "7", value: t.lat, regex:/^[0-9]{7}$/}), nbsp)
    }
 }
 

 /**
  * Lat long input fields.
  * FIXME: Only one at a time because of use if id attribute. OK? 
  */
const reg_MIN =  /^(([0-5]?[0-9])|60)(\.([0-9]{1,4}))?$/;
 
const latLngInput = class {
    
    constructor() {
        this.Nd = m.stream("");
        this.Nm = m.stream("");
        this.Ed = m.stream("");
        this.Em = m.stream("");
    }
    
    view(vn) {
        const center = CONFIG.mb.getCenter();
        return m("span",                 
                 { onclick: function() {     
                     pol.ui.autojump('ll_Nd', 'll_Nm');
                     pol.ui.autojump('ll_Nm', 'll_Ed');
                     pol.ui.autojump('ll_Ed', 'll_Em'); 
                 }},
            m(textInput, {id:"ll_Nd", size: "2", maxLength: "2", value: this.Nd, regex:/^(([0-8]?[0-9])|90)$/}), "°", nbsp,nbsp,
            m(textInput, {id:"ll_Nm", size: "6", maxLength: "6", value: this.Nm, regex: reg_MIN }), "\'", nbsp, 
            m("span#ll_NS",   {onclick:this.clickNS}, (center[1] < 0 ? "S":"N")), nbsp, nbsp,
            m(textInput, {id:"ll_Ed", size: "3", maxLength: "3", value: this.Ed, regex:/^[0-9]{1,3}$/}), "°", nbsp,nbsp,
            m(textInput, {id:"ll_Em", size: "6", maxLength: "6", value: this.Em, regex: reg_MIN }), "\'", nbsp,  
            m("span#ll_EW",   {onclick:this.clickEW}, (center[0] < 0 ? "W":"E")), nbsp, nbsp)
    }
        
    onupdate (vn) {
        const x = pol.mapref.parseDM(this.Nd(), this.Nm(), this.Ed(), this.Em())
        if (vn.attrs && vn.attrs.value) {
            const ns = $("#ll_NS").html();
            const ew = $("#ll_EW").html();
            vn.attrs.value[0] = (ew=='W' ? -x[0] : x[0]);
            vn.attrs.value[1] = (ns=='S' ? -x[1] : x[1]);
        }
    }
    
    
    /* Change betwen E and W by clicking on the letter */
    clickNS() {    
       const val = $("#ll_NS").html();
          $("#ll_NS").html( (val=="N" ? "S" : "N"));
    }
    
    /* Change between N and S by clicking on the letter */
    clickEW() {
       const val = $("#ll_EW").html();
          $("#ll_EW").html( (val=="E" ? "W" : "E"));
    }
}
 
 
 
const latLngInputDec = class {
    
    constructor() {
        this.Nd = m.stream("");
        this.Ed = m.stream("");
    }
    
    view(vn) {
        const center = CONFIG.mb.getCenter();
        return m("span",                 
                 { onclick: function() {     
                     pol.ui.autojump('ll_Nd', 'll_Ed'); 
                 }},
            m(textInput, {id:"ll_Ndd", size: "8", maxLength: "12", value: this.Nd, 
                regex:/^\-?(([0-8]?[0-9])(\.[0-9]+)?|90(\.0+)?)?$/}), "° N", nbsp,nbsp,
            m(textInput, {id:"ll_Edd", size: "9", maxLength: "13", value: this.Ed, 
                regex:/^\-?[0-9]{1,3}(\.[0-9]+)?$/}), "° E", nbsp,nbsp )
    }
        
    onupdate (vn) {
        const x = pol.mapref.parseDM(this.Nd(), 0, this.Ed(), 0)
        if (vn.attrs && vn.attrs.value) {
            vn.attrs.value[0] = x[0];
            vn.attrs.value[1] = x[1];
        }
    }
}



 
const removeEdit = {
    view: vn => {
        return m("span.removeEdit", [ 
            m("img", {src:"images/edit-delete.png",
                onclick: vn.attrs.remove }), 
            m("img", {src:"images/edit.png",
                onclick: vn.attrs.edit }),
        ]);    
    }
}
 
 
 
 
 
 
/**
 * Use an element as a drag-drop zone for files.
 */

function dragdrop(element, onchange) {
	
	element.addEventListener("dragover", activate)
	element.addEventListener("dragleave", deactivate)
	element.addEventListener("dragend", deactivate)
	element.addEventListener("drop", deactivate)
	element.addEventListener("drop", update)
	window.addEventListener("blur", deactivate)

	function activate(e) {
		e.preventDefault();
        $(element).addClass("dragover");
	}

	function deactivate() {
        $(element).removeClass("dragover");
    }
	
	
    /* This is called when item is dropped on the element 
     * options.onchange is called using the dropped items as argument.. 
     */
	function update(e) {
		e.preventDefault()
		if (typeof onchange == "function") {
			onchange((e.dataTransfer || e.target))
		}
	}
}


   
 
// FIXME: Move to a another source file? 
function formatDTG(date) {
    const mths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                  'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const ltime = new Date(date);
    const mth = mths[ltime.getMonth()]; 
    const day = ltime.getDate();
    const hour = ltime.getHours();
    const min = ltime.getMinutes();
    return day + ' ' +mth + ' ' + hour+":"+(min<=9 ? '0': '') + min; 
}



 
 
