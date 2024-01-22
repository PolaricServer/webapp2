

pol.tracking.LabelStyle = class {
    
    constructor() {
        this.currentIndex = 0; 
        this.start = 5;
        this.styles = ["40%", "50%", "60%", "70%", "80%", "90%", "100%", "110%", "120%", "130%", "140%", "150%"];
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
            this.setFont()
        } 
    }


    previous() {
        if (this.currentIndex > 0-this.start) {
            this.currentIndex--;
            this.setFont()
        }
    }



    getFontSize() {
        return this.styles[this.currentIndex + this.start];
    }
    
}




