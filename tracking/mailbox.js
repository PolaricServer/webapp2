
/*
 Map browser based on OpenLayers 5. Tracking. 
 Messaging.
 
 Copyright (C) 2017-2020 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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


/**
 */


 
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
   
        t.sendMsg = {
            view: function() {
                return m("div#sendMsg", [
                
                    m("span.xsleftlab", "To:"),
                    m(textInput, 
                        { id: "recipient", value: t.recipient,
                            maxLength: 40, regex: /.*/i }), br, 
                    m("span.xsleftlab", "Message:"),
                    m(textInput,
                        { id: "msg", value: t.msg,
                            maxLength: 66, regex: /.*/i }), 
                    m("button", { type: "button", onclick: send }, "Send"),
                ]);
            }
        }
        
        
        t.widget = {
            view: function() {
                var i=0;
                return m("div#mailbox", [
                    m("h1", "My Short Messages"),
                    m("div#msglist", 
                    m("table", m("tbody", t.msglist.map( x => {
                        return m("tr", [
                            m("td", m("img", {"class":(x.outgoing ? "ticon" : "icon"), 
                                 src: (x.outgoing ? 'images/32px/chatt.png':'images/32px/chatf.png')})),
                            m("td", m("div", [
                                m("span", {"class":"header"}, [formatDTG(x.time)+": ", x.from + " > "+ x.to]),
                                (x.status==0 || !x.outgoing ? "" 
                                 : m("img", {class: "status", title: x.stinfo, src: (x.status == 1 
                                     ? "images/16px/ok.png" 
                                     : "images/16px/warn.png")})),  
                                br, m("span.txt", x.text)
                            ] ))
                        ]);            
                    })))),
                    (CONFIG.server.auth ? m(t.sendMsg) : "")
                ]);  
            }
        };

        
        getMsgs();
        setInterval(getMsgs, 1200000);
       
       /* 
        * Subscribe to notifications from server using the pubsub service: 
        * Related to user (if logged in). 
        */
        t.server.pubsub.subscribe("messages:" + t.server.auth.userid, 
            x => { 
                t.msglist.push(x); 
                m.redraw();
                addScroll(true); 
            }
        );   
        t.server.pubsub.subscribe("msgstatus:" + t.server.auth.userid, 
            x => { 
                setStatus(x);
                m.redraw();
            }
        );             
        t.resizeObserve( ()=>addScroll(true) );
        
        
        
        function setStatus(st) {
            console.log("Message status (msgid="+st.msgId+", status="+st.status+"): "+st.info);
            for (const i in t.msglist)
                if (t.msglist[i].msgId == st.msgId) {
                    t.msglist[i].status = st.status;
                    t.msglist[i].stinfo = st.info;
                    break;
                }
        }
        
        
        function addScroll(moveend) {
            t.setScrollTable2("div#mailbox", "div#msglist tbody", "div#sendMsg", moveend); 
        }
        
        /* Get list of messages from server */
        function getMsgs() {
            const userid = t.server.auth.userid;
            console.assert(userid && userid!=null, "userid="+userid);
            if (userid == null)
                return;
            t.server.GET("mailbox", "", x => { 
                t.msglist = JSON.parse(x);
                m.redraw();
                addScroll(true);
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
                    addScroll(true);
                },
                x => {
                    console.log("Send message -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot send message:" + 
                        '\n"' + x.responseText + '"');
                }  
            );
        }
        
    
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};     
        
    } /* constructor */

} /* class */





pol.widget.setFactory( "tracking.Mailbox", {
        create: () => new pol.tracking.Mailbox()
    }); 

