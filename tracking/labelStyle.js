

pol.tracking.LabelStyle = class {

    constructor() {
        this.currentIndex = 0;
        this.start = 5;
        this.styles = ["50%", "60%", "70%", "80%", "90%", "100%", "110%", "120%", "130%", "140%", "150%"];
        this.scales = [  0.8,   0.9,   1.0,   1.0,   1.0,    1.0,    1.1,    1.2,    1.3,    1.4,   1.4 ];

        CONFIG.get("tracking.labelStyle").then( x=> {
            const xx = parseInt(x);
            if (xx) this.currentIndex = xx;
        });
    }


    setFontForClass(idx, cl) {
        const elements = document.getElementsByClassName(cl);
        for (const x of elements)
            x.style.fontSize = this.styles[idx];
    }


    setFont() {
        CONFIG.storeSes("tracking.labelStyle", ""+this.currentIndex);
        var idx = this.currentIndex + this.start;
        this.setFontForClass(idx, 'lstill');
        this.setFontForClass(idx, 'lobject');
        this.setFontForClass(idx, 'lmoving');
    }


    next() {
        if (this.currentIndex < this.styles.length-this.start-1) {
            this.currentIndex++;
            this.setFont();
            CONFIG.tracks.updateIconStyle();
        }
    }


    previous() {
        if (this.currentIndex > 0-this.start) {
            this.currentIndex--;
            this.setFont();
            CONFIG.tracks.updateIconStyle();
        }
    }



    getFontSize() {
        return this.styles[this.currentIndex + this.start];
    }


    getIconScale() {
        return this.scales[this.currentIndex + this.start];
    }
}




