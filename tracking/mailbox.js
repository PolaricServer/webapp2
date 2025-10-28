
/*
 Map browser based on OpenLayers 5. Tracking.
 Messaging.

 Copyright (C) 2017-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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
 * Notification list widget (in a popup window).
 */

pol.tracking.Mailbox = class extends pol.core.Widget {

    constructor ()
    {
        super();
        this.classname = "tracking.Maibox";
        this.notifier = CONFIG.notifier;
        var t = this;
        t.server = CONFIG.server;
        t.recipient = m.stream("");
        t.msg = m.stream("");
        t.msglist = [];
        t.users = [];
        t.uvisible = false;

        /* List of available (logged-in) users */
        t.showUsers = {
            view: function() {
                return m("div#recipients", t.users.map( x=> {
                    return m("span", {onclick: ()=>{t.recipient(x);}}, x, " ");
                }))
            }
        }

        /* Form for writing a message */
        t.sendMsg = {
            view: function() {
                return m("div#sendMsg", [

                    m("div.field",
                        m("span.xxsleftlab", "To:"),
                        m(pol.ui.textInput,
                            { id: "recipient", value: t.recipient,
                                maxLength: 40, regex: /.*/i }),
                            m("img#ulist", {src:"images/participant.png",
                                title:"Show logged on users (on/off)", onclick:()=>toggleUsers()}),
                        //  nbsp, m(pol.ui.checkBox,{title: "Tick to send as plain APRS"}, "@APRS")
                    ),



                    m("div.field",
                        m("span.xxsleftlab", "Text:"),
                        m(pol.ui.textInput,
                            { id: "msg", value: t.msg,
                                maxLength: 66, regex: /.*/i }),
                       m("img#sendmsg", {src:"images/sendmsg.png",
                                title:"Send message", onclick:send} ))
                ]);
            }
        }

        /* Main widget */
        t.widget = {
            view: function() {
                var i=0;
                return m("div#mailbox", [
                    m("h1", "My Short Messages"),
                    m("div#msglist",
                    m("table", m("tbody", t.msglist.map( x => {
                        return m("tr",
                            [
                                m("td", m("img", {"class":(x.outgoing ? "ticon" : "icon"),
                                    src: (x.outgoing ? 'images/32px/chatt.png':'images/32px/chatf.png')})),
                                m("td"+(x.outgoing ? ".out" : ""), m("div", [
                                    m("span", {"class":"header"}, [ pol.ui.formatDTG(x.time)+": ",
                                        ( x.outgoing ? x.from
                                            : m("span.fromaddr", {onclick: ()=> {t.recipient(x.from);}}, x.from)),
                                        nbsp, m("img", {src:"images/16px/dE.png"}), pol.ui.nbsp, //  > ",
                                        ( !x.outgoing ? x.to
                                            : m("span.fromaddr", {onclick: ()=> {t.recipient(x.to);}}, x.to)) ]),

                                    m("img", {class: "status", src: "images/16px/close.png",
                                        onclick: ()=>t.remove(x.msgId)}),

                                    (x.status==0 || !x.outgoing ? ""
                                    : m("img", {class: "status", title: x.stinfo, src:
                                        ( x.status == 1 ? "images/16px/ok.png"
                                             : (x.status == 2 ? "images/16px/maybe.png" : "images/16px/warn.png") )})),
                                    br, m("span.txt", x.text)
                                ] ))
                            ]
                        );
                    })))),
                    m(t.showUsers),
                    (CONFIG.server.isAuth() ? m(t.sendMsg) : "")
                ]);
            }
        };

        t.getMsgs();
        t.resizeObserve( ()=>t.addScroll(true) );
        setInterval(()=>getUsers(), 120000);


        /*
         * IF user is logged out, popup will be closed
         */
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });



        function toggleUsers() {
            if (t.uvisible) {
                t.uvisible=false;
                $('div#recipients').css('display','none');
                setTimeout(()=>t.addScroll(true), 200);
            }
            else {
                getUsers();
                t.uvisible=true;
                $('div#recipients').css('display','block');
            }
        }


        function getUsers() {
            const userid = t.server.auth.userid;
            if (userid == null)
                return;

            t.server.GET("loginusers", "", x => {
                t.users = GETJSON(x);
                m.redraw();
                setTimeout(()=>t.addScroll(true), 200);
            } );
        }




        /* Send message */
        function send() {
            const msg = {
                to: t.recipient(),
                text: t.msg(),
            }

            t.server.POST("mailbox", JSON.stringify(msg),
                x => {
                    console.log("Sent message to: "+msg.to);
                    t.msg("");
                    m.redraw();
                    t.addScroll(true);
                },
                x => {
                    console.log("Send message -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot send message:" +
                        '\n"' + x.responseText + '"');
                }
            );
        }


    } /* constructor */


    /* Remove message from list */
    remove(id) {
        this.server.DELETE("mailbox/"+id,
            x => {
                console.log("Remove message: "+id);
            },
            x => {
                console.log("Remove message -> "+x.status+": "+x.statusText +
                    " ("+x.responseText+")");
            }
        );
    }



    /* Get list of messages from server */
    getMsgs() {
        const userid = this.server.auth.userid;
        console.assert(userid && userid!=null, "userid is undefined");
        if (userid == null)
            return;
        this.server.GET("mailbox", "", x => {
            this.msglist = GETJSON(x);
            m.redraw();
            this.addScroll(true);
        } );
    }



    /* Reply to message (fill in recipient field) */
    reply(msg) {
        if (msg.outgoing)
            this.recipient(msg.to);
        else
            this.recipient(msg.from);
        m.redraw();
    }


    addScroll(moveend) {
        this.setScroll("div#mailbox", "div#msglist tbody", moveend);
    }


    setStatus(st) {
        for (const i in this.msglist)
            if (this.msglist[i].msgId == st.msgId) {
                this.msglist[i].status = st.status;
                this.msglist[i].stinfo = st.info;
                break;
            }
        }


    onActivate() {
        console.assert(this.server.authOk, "Connection to server not established");
       /*
        * Subscribe to notifications from server using the pubsub service:
        * Related to user (if logged in).
        */
        this.pscli1 = this.server.pubsub.subscribe("messages:" + this.server.auth.userid,
            x => {
                this.msglist.push(x);
                m.redraw();
                setTimeout(()=> this.addScroll(true), 500);
            }
        );
        this.pscli2 = this.server.pubsub.subscribe("msgstatus:" + this.server.auth.userid,
            x => {
                this.setStatus(x);
                m.redraw();
            }
        );
        this.pscli3 = this.server.pubsub.subscribe("msgdelete:" + this.server.auth.userid,
            x => {
                this.msglist = [];
                m.redraw();
                this.getMsgs();
            }
        );
        this.getMsgs();
    }


    onclose() {
        if (this.pscli1 != null)
            this.server.pubsub.unsubscribe("messages:" + this.server.auth.userid, this.pscli1);
        if (this.pscli2 != null)
            this.server.pubsub.unsubscribe("msgstatus:" + this.server.auth.userid, this.pscli2);
        if (this.pscli3 != null)
            this.server.pubsub.unsubscribe("msgdelete:" + this.server.auth.userid, this.pscli3);
        this.pscli1=this.pscli2=this.pscli3=null;
        super.onclose();
    }


} /* class */



pol.widget.setFactory( "tracking.Mailbox", {
        create: () => new pol.tracking.Mailbox()
    });
