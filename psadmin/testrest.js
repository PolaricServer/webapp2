/*
 Map browser based on OpenLayers 5. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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


pol.psadmin = pol.psadmin || {};

/**
 * Reference search (in a popup window).
 */

pol.psadmin.TestRest = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "psadmin.TestRest";
        t.url = m.stream("");
        t.method = m.stream("GET");
        t.body = null;
        t.sel = {json: false, hdrs: false};
        t.response = "";
        t.headers = [{name: m.stream(""), val: m.stream("")} ];


        var headerEdit = {
            view: function() {
                var i=0;
                return m("span.headerEdit",
                    t.headers.map( x => {
                        i++;
                        return m("span", [
                            m(textInput, {value: x.name, size: 10}), " ", m(textInput, {value: x.val, size: 20}),
                            (i < t.headers.length ? br : m("span.plus", {onclick: addHdr}, "+"))
                        ]);
                    })
                )
            }
        }



        this.widget = {
            view: function() {
                return m("div#testrest", [
                    m("h1", "REST API Testbench"),

                    m("div.field",
                        m("span.xsleftlab", "Method:"),
                        m(select, {
                            id: "methodSelect",
                            onchange: onMethodSelect,
                                list: [
                                    {label: "GET", val: 'GET'},
                                    {label: "POST", val: 'POST'},
                                    {label: "PUT", val: 'PUT'},
                                    {label: "DELETE", val: 'DELETE'}
                                ]})),

                    m("div.field",
                        m("span.xsleftlab", "Resource:"),
                        m(textInput, { id:"url", value: t.url, size: 35,
                            maxLength:35, regex: /.*/i })),

                    ( t.method() === "POST" || t.method() === "PUT" ?
                        m("div.field",
                            m("span.xsleftlab", "Body:"),
                            m("textarea", { id:"body", value: t.body, size: 256 }))
                        : null),

                    ( t.sel.hdrs  ?
                        m("div.field",
                            m("span.xsleftlab", "Headers:"),
                            m(headerEdit))
                        : null),

                    m("div.field",
                        m("span.xsleftlab", "Select: "),
                            m(checkBox, {id:"sel.json", onclick: selJson, checked: (t.sel.json),
                                title: "Check to parse response data as JSON" },
                                "JSON resp", nbsp, nbsp),
                        m(checkBox, {id:"vis.zoom", onclick: selHdrs, checked: (t.sel.hdrs),
                            title: "Check to edit headers for request" },
                            "Headers", nbsp, nbsp),
                     ),

                    br,
                    m("div#testResp", t.response),


                    m("div.butt", [
                        m("button", { type: "button", onclick: test }, "SEND"),
                        m("button", { type: "button", onclick: clearHdrs }, "Clr Hdr"),
                    ]),
                ])
            }
        };



        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};


        function selJson() {
            t.sel.json = !t.sel.json;
        }


        function addHdr() {
            t.headers.push( {name: m.stream(""), val: m.stream("")} );
            m.redraw();
        }


        function clearHdrs() {
            t.headers = [ {name: m.stream(""), val: m.stream("")} ];
            m.redraw();
        }


        function selHdrs() {
            t.sel.hdrs = !t.sel.hdrs;
            m.redraw();
        }

        function onMethodSelect () {
            const meth = $('#methodSelect').val();
            t.method(meth);
            m.redraw();
        }

        function getHeaders() {
            let hdrs = {};
            for (const x of t.headers)
                if (x.name() != "" && x.val != "")
                    hdrs[x.name()] = x.val();
            return hdrs;
        }


        function test() {
            t.response = "";
            t.body = $("#body").val();
            m.redraw();

            if (t.method()==="GET")
                t.server.GET(t.url(), null, success, error, null, getHeaders());
            else if (t.method() ==="POST")
                t.server.POST(t.url(), t.body, success, error, null, getHeaders());
            else if (t.method() ==="PUT")
                t.server.PUT(t.url(), t.body, success, error, null, getHeaders());
            else if (t.method() ==="DELETE")
                t.server.DELETE(t.url(), success, error, null, getHeaders());
        }


        function success(x) {

            $("#testResp").removeClass("err").addClass("success");
            if (t.sel.json)
                try {
                    console.log("RESPONSE: ", GETJSON(x));
                    t.response = "Success (JSON)";
                }
                catch(err) {
                    t.response = "RETURN VALUE NOT JSON!!";
                    $("#testResp").removeClass("success").addClass("err");
                }
            else {
                console.log("RESPONSE: ", x);
                if (x.length < 32)
                    t.response = "Success: '"+x+"'";
                else if (!t.sel.json && x.length < 300)
                    t.response = x;
                else
                    t.response = "Success (see log)";
            }
            m.redraw();
        }



        function error(x) {
            t.response = x.statusText;
            console.log("ERROR: ", t.response);

            if (x.responseText != null && x.responseText.length < 100)
                t.response += ": "+x.responseText;
            else
                t.response += " (see log)";
            m.redraw();
            $("#testResp").removeClass("success").addClass("err");
        }



    } /* constructor */



} /* class */




pol.widget.setFactory( "psadmin.TestRest", {
        create: () => new pol.psadmin.TestRest()
    });
