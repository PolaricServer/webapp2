

pol.tracking.LabelStyle = class {
    
    constructor() {
        this.currentIndex = 0; 
        this.start = 5;
        this.styles = ["40%", "50%", "60%", "70%", "80%", "90%", "100%", "110%", "120%", "130%", "140%", "150%"];
        const x = parseInt(CONFIG.get("tracking.labelStyle"));
        if (x) this.currentIndex = x; 
    }


    setFontForClass(idx, cl) {
        const elements = document.getElementsByClassName(cl);         
        for (const x of elements)
            x.style.fontSize = this.styles[idx];
    }


    setFont() {
        CONFIG.store("tracking.labelStyle", ""+this.currentIndex);
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




