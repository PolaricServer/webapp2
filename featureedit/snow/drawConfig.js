
var snow = snow || {};


//Set the desired colors underneat with Hex Variables.
//must contain a string like #fff with values between 0-9 and a-f and 3 or 6 hex decimals
//Defaults back to default hex if providing wrong values
//default color: black, default hex: #1f1f1f

snow.color = [
    {fill: "#1f1f1f", stroke: null}, // Default Black
    {fill: "#e60505", stroke: "#d00505"}, // Default Red
    {fill: "#ff9a28", stroke: "#d07000"}, // Default Orange
    {fill: "#ffff00", stroke: "#a06000"}, // Default Yellow
    {fill: "#01b301", stroke: "#01a001"}, // default Green
    {fill: "#05a0d0", stroke: "#0285c0"}, // default Blue
    {fill: "#a300a3", stroke: null}  // default Purple
];


//Activate Freehand drawing? Y/N
snow.activateFreedraw = "N"
