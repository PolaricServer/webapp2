 
pol.core.Time = class {
    
    /* Handler is a function. It is called when time is changed */
    constructor(handler) {
        var t = this;
    
        t.handler = handler;
        t.tdate = formatDate(new Date());
        t.ttime = m.stream( formatTime(new Date()) );
    }
    
    
    
    static parseDate(d) {
        return new Date(d);
    }


    static decrementDay(d) {
        let day = d.getDate(); 
        day--;
        d.setDate(day);
    }

    static incrementDay(d) {
        let day = d.getDate(); 
        day++;
        d.setDate(day);
    }



    static formatDate(d) {
        return ""+d.getFullYear() + "-" + 
            (d.getMonth()<9 ? "0" : "") + (d.getMonth()+1) + "-" +
            (d.getDate()<10 ? "0" : "")  + d.getDate();
    }


    static formatTime(d) {
        return "" +
            (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
            (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
    }


    static pad(number, size) {
        var paddedNumber = String(number);
        while (paddedNumber.length < size) {
            paddedNumber = "0" + paddedNumber;
        }
        return paddedNumber;
    }


    adjust_time(hour_increment, minute_increment) {
        const tm = this.ttime();
        const [hour, minute] = tm.split(':').map(Number);
        let newHour = hour + hour_increment;
        let newMinute = minute + minute_increment;
        if (newMinute > 59) {
            newHour++;
            newMinute -= 60;
        } else if (newMinute < 0) {
            newHour--;
            newMinute += 60;
        }
        if (newHour > 23) {
            let d = new Date(this.tdate);
            pol.core.Time.incrementDay(d);
            this.tdate = formatDate(d);
            newHour = 0;
        } else if (newHour < 0) {
            let d = new Date(this.tdate);
            pol.core.Time.decrementDay(d);
            this.tdate = formatDate(d);
            newHour = 23;
        }
        this.ttime(pol.core.Time.pad(newHour,2) + ':' + pol.core.Time.pad(newMinute,2));
        if (this.handler instanceof Function) 
            this.handler();
    }

    decr_minute() {
        this.adjust_time(0, -1);
    }

    incr_minute() {
        this.adjust_time(0, 1);
    }

    decr_hour() {
        this.adjust_time(-1, 0);
    }

    incr_hour() {
        this.adjust_time(1, 0);
    }
    
    
    timeIsSet() { 
        if (this.tdate == null || this.ttime == null || this.tdate == '' 
             || this.ttime == '' || this.tdate == '-' || this.ttime == '-' )
            return false;
        return true;
    }
    
    
    setNow() {
        const now = new Date();
        this.tdate = formatDate(now);
        this.ttime(formatTime(now));
    }
}
