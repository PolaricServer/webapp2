
/*
 Map browser based on OpenLayers. Tracking.
 Notifications.

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
 /*
  * Notification:
  *     - type: Code or text. Use to select icon.
  *     - from: Sender of the notification. Username, "system", etc...
  *     - time: Time of event
  *     - text: Text of notification.
  *
  * FIXME: Open another window if clicking on certain types of notifications (messages).
  */



/**
 * Subscribe to notifications from server and provide a notifications
 * icon on toolbar.
 */

pol.tracking.Notifier = class {

    constructor() {
        this.list = [];
        this.server = CONFIG.server;
        var t = this;
        t.list = [];
        this.audio = new Audio('sound/sound2.wav');

        /* Get stored notifications from local storage */
        CONFIG.get("tracking.Notifications").then( x=> {
            t.list = x;
            if (t.list == null)
                t.list = [];
        });

        /* Add nofifications icon to toolbar or set it visible if it exists */
        if (CONFIG.mb.toolbar.divExists("toolbar_not"))
            CONFIG.mb.toolbar.hideDiv("toolbar_not", false);
        else {
            CONFIG.mb.toolbar.addDiv(3 ,"toolbar_not", "Nofifications");
            $('#toolbar_not').append('<img src="images/bell.png"></img>');
            $('#toolbar_not').click(
                () => WIDGET("tracking.NotifyList", [180,70], true));
        }

        t.updateNumber();

       /*
        * Subscribe to notifications from server using the pubsub service:
        * Related to user (if logged in), general system notifications and
        * (if authorized) related to admin user
        */
        if (t.server.isAuth())
            t.server.pubsub.subscribe("notify:" + t.server.userid,
                x => t.add(x) );
        t.server.pubsub.subscribe("notify:SYSTEM",
            x => t.add(x) );
        if (t.server.auth.admin)
            t.server.pubsub.subscribe("notify:ADMIN",
                x => t.add(x) );

        /* Remove notifications older than ttl. Skip if ttl is 0 */
        /* TTL is in minutes */
        t.setInt = setInterval( () => {
            for (const i in t.list) {
                const x = t.list[i];
                if (x.ttl <= 0)
                    continue;
                const dt = new Date(x.time);
                if (dt.getTime() / 60000 + x.ttl < Date.now()/60000)
                    t.remove(i);
            }
        }, 10000);

    } /* constructor */



    stop() {
        const t = this;
        if (t.setInt != null)
            clearInterval(t.setInt);
        /*
         * This can be called AFTER a login has been invalidated, so we
         * have to jsut unsubscribe the rooms
         */
        t.server.pubsub.unsubscribeAll("notify:" + t.server.userid);
        t.server.pubsub.unsubscribeAll("notify:SYSTEM");
        t.server.pubsub.unsubscribeAll("notify:ADMIN");

        if (CONFIG.mb.toolbar.divExists("toolbar_not"));
            CONFIG.mb.toolbar.hideDiv("toolbar_not", true);
    }


    /**
     * Update number on toolbar.
     */
    updateNumber() {
        $('#not_number').remove();
        if (this.list.length > 0)
            $('#toolbar_not').append('<span id="not_number">'+this.list.length+'</span>');
        m.redraw();
    }


    /**
     * Add notification.
     */
    add(not) {
        this.audio.play();
        this.list.unshift(not);
        this.updateNumber();
        CONFIG.store("tracking.Notifications", this.list);
        m.redraw();
    }


    /**
     * Remove notification.
     */
    remove(idx) {
        this.list.splice(idx,1);
        this.updateNumber();
        CONFIG.store("tracking.Notifications", this.list);
        m.redraw();
    }

} /* class */




/**
 * Notification list widget (in a popup window).
 */

pol.tracking.NotifyList = class extends pol.core.Widget {

    constructor ()
    {
        super();
        this.classname = "test.NotifyList";
        this.notifier = CONFIG.notifier;
        var t = this;
        t.msg = m.stream("");

        t.sendNot = {
            view: function() {
                return m("div#sendNot", [
                    m(pol.ui.textInput,
                        { id: "notMsg", value: t.msg,
                            maxLength: 55, regex: /.*/i }),
                    m("button", { type: "button", onclick: send }, "Send"),
                ]);
            }
        }


        t.widget = {
            view: function() {
                var i=0;
                return m("div#notifications", [
                    m("h1", "My Notifications"),
                    m("table", m("tbody", (CONFIG.notifier ? CONFIG.notifier.list : []).map( x => {
                        return m("tr", [
                            m("td", m("img", {onclick: (x.type==='chat'
                                ?  ()=> WIDGET("tracking.Mailbox",[50,70], true) : null),
                                "class":"icon", src:icon(x.type)})),
                            m("td", m("div", [
                                m("span.header", [x.from+", "+formatDTG(x.time)]),
                                m("img", {src:"images/16px/close.png", onclick: pol.ui.apply(removeNot, i++) }),
                                br, m("span.txt", {title: x.text}, limit(x.text, 32))
                            ] ))
                        ]);
                    }))),
                    (CONFIG.server.auth && CONFIG.server.auth.admin ? m(t.sendNot) : "")
                ]);
            }
        };



        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });


        function limit(x, limit) {
            return (x.length > limit ?
                    x.substring(0, limit - 3) + "..." : x);
        }


        function send() {
            const msg = {
                type: "info",
                from: "admin",
                time: new Date(),
                text: t.msg(),
                ttl: 120
            }
            CONFIG.server.pubsub.put("notify:SYSTEM", msg);
        }


        /*
         * Select the icon from the type of notification.
         * Type can be 'loc', 'check', 'chat', 'mail', 'system', 'error', 'alert' or 'info' (default)
         */
        function icon(type) {
            if (type==='loc') return 'images/32px/loc.png';
            else if (type==='share') return 'images/32px/sharing.png';
            else if (type==='check') return 'images/32px/check2.png';
            else if (type==='chat') return 'images/32px/chat2.png';
            else if (type==='mail') return 'images/32px/mail.png';
            else if (type==='system') return 'images/32px/system2.png';
            else if (type==='error') return 'images/32px/error.png';
            else if (type==='alert') return 'images/emergency.png';
            else return 'images/32px/info.png';
        }


        /* Remove notification from list */
        function removeNot(id) {
            t.notifier.remove(id);
            m.redraw();
        }

        function addScroll(moveend) {
            t.setScroll("div#notifications", "div#notifications tbody", moveend);
        }
        t.resizeObserve( ()=>addScroll() );
        addScroll();

    } /* constructor */




} /* class */




pol.widget.setFactory( "tracking.NotifyList", {
        create: () => new pol.tracking.NotifyList()
    });
