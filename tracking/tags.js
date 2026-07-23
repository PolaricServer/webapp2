/*
 Map browser based on OpenLayers 5. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2020-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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






var pol = window.pol;
/**
 * Reference search (in a popup window).
 */

pol.tracking.Tags = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";

        t.server = CONFIG.server;
        t.ident = m.stream("");
        t.tag = m.stream("");
        t.tagsOn = [];
        t.usedTags = [];
        t.negTags = new Set();
        t.classname = "tracking.Tags";
        t.url = "";

        t.shortcuts = [
            {descr: "Visible for all - in 'tracking'", tagson: ["OPEN", "track"], tagsoff: [] }
        ]


        this.widget = {
            view: function() {
                var i=0;
                return m("div#itemtags", [
                    m("h1", "Tags for "+t.ident()),

                    m("div.tagList", t.tagsOn.map( x=> {
                        if (t.negTags.has(x))
                            return  m("span.disabled", x);
                        else
                            return [ m("span.box", [
                                m("img",  {src: "images/edit-delete.png", onclick: pol.ui.apply((x)=>t.remove(x), x)}),
                                (x.charAt(0)=='-' ? m("span.negtag", x) :
                                    (x.charAt(0)=='+' ? m("span.usertag", x.substring(1)) :
                                        m("span.systag", x))) ])]
                    })),
                    m(textInput, {list: "usedTags", value: t.tag}),
                    m("datalist#usedTags", t.usedTags.map( x=> {
                        return m("option", x)
                    })),

                    m("button", { type: "button", onclick: add }, "Add")
                ])
            }
        };


        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });


        function tagIsOn(tag) {
            for (tg of t.tagsOn) {
                if (compare(tag, tg)) {
                    /* Check if it is turned off by negative tag */
                    if (t.negTags.has(tag) || t.negTags.has("+"+tag))
                        return false;
                    return true;
                }
            }
            return false;

            function compare(t1, t2) {
                if (t1==t2 || "+"+t1 == t2 || t1 == "+"+t2)
                    return true
                return false;
            }
        }



        function removeNegative(tag) {
            console.log("RemoveNegative", tag, t.negTags)
            if (t.negTags.has(tag)) {
                console.log("removed=>", t.negTags)
                t.negTags.delete(tag);
                return true;
            }
            return false;
        }


        function add() {
            let arg = [t.tag()];
            if (removeNegative(t.tag()))
                t.remove("-"+t.tag());
            else
                t.server.POST(t.url, JSON.stringify(arg),
                    ()=> { t.getTags(); },
                    (x)=> { console.warn("Couldn't add tag: "+x); }
                );
        }

    } /* constructor */


    remove(x) {
        x = encodeURIComponent(x);
        this.server.DELETE(this.url+"/"+x,
            ()=> { this.getTags(); m.redraw();  },
            (x)=> { console.warn("Couldn't delete object: "+x); })
    }

    onActivate() {
        setTimeout(()=>{this.getTags()}, 1000);
    }


    setIdent(id) {
        this.ident(id);
        if (id=='mytrackers')
            this.url = "trackers/tags";
        else
            this.url = "item/"+id+"/tags";
        m.redraw();
    }


    /* Get list of tags from backend server */
    getTags() {
        this.server.GET("system/tags", null,
            x=> {
                this.usedTags=GETJSON(x);
                this.usedTags.sort((x,y)=> {return x>y});
                m.redraw();
            },
            ()=> { console.warn("Couldn't get tag list"); }
        )

        this.server.GET(this.url, null,
            x=> {
                this.negTags.clear();
                this.tagsOn=GETJSON(x);
                this.tagsOn.sort((x,y)=> {return x>y});
                for (const tt of this.tagsOn)
                    if (tt.charAt(0) == '-')
                        this.negTags.add(tt.substring(1));
                m.redraw()
            },
            ()=> { console.warn("Couldn't get tag-list for item"); }
        )
    }


} /* class */


pol.widget.setFactory( "tracking.Tags", {
        create: () => new pol.tracking.Tags()
    });
