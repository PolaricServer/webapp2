# Snow Marking Module
This application is a bachelor project made to work with https://github.com/PolaricServer/webapp2<br/>
It's made by Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 

The project was to make a marking module that could be used in Search And Rescue operations to better mark areas on the map for information.
Installation progress is currently only in norwegian. Translation will come.

Installation:<br/>
Ved installasjon er det viktig å sørge for at knappen som aktiverer tegn funksjonen blir lagt til. I vår applikasjon ser den slik ut og er en enkel knapp lagt til i html filen.

![Activate Draw_BUTTON](https://user-images.githubusercontent.com/26407740/56897187-1fa02500-6a8e-11e9-8280-0b8ec391f137.PNG)

Ved implementasjon til Polaric Server så lagde vi en egen knapp som vi la til på toolbaren til applikasjonen som håndterer dette.

![Activate Draw](https://user-images.githubusercontent.com/26407740/56897235-46f6f200-6a8e-11e9-914e-dcd2caef6a72.png)

Det er to krav til denne knappen. Det første er at navnet som gis til den er tb_draw det andre er at den har en onclick event som kaller på tb_draw_click(). (se under) <br/>
onclick="tb_draw_click()"

Det neste steget er å implementere SnowMarkerModule. 

Vi har her laget en egen konfigurasjonsfil kalt drawConfig.js som lar deg endre navnet på kartet til å kunne være kompatibel med enhver applikasjon. Standard navnet er browser.map siden denne applikasjonen var lagd for bruk med aprs.no og vi derfor fulgte navngivingen som gitt i denne applikasjonen. Om applikasjonen bruker standard “map” som navn så må denne linjen fjernes eller kommenteres ut. 
Linjen som må endres kan sees under.<br/>
var map = browser.map

drawConfig.js lar deg også endre fargene som brukes til å tegne på kartet. Disse fargene er de som vises i seksjonen som vises under. 

![ColorSelector](https://user-images.githubusercontent.com/26407740/56897220-38a8d600-6a8e-11e9-8c37-a5577e05ee07.PNG)

Fargene kan endres ved å gi nye hexadesimale koder til fargene. Disse kan genereres med verktøy lignende som CSS color picker: https://www.w3schools.com/colors/colors_picker.asp.

Linjene som konfigurerer fargene ser slik ut:

//default color: black, default hex: #1f1f1f<br/>
var color1 = "#1f1f1f"<br/>
//default color: red, default hex: #e60000<br/>
var color2 = "#e60000"<br/>
//default color: orange, default hex: #ff9a28<br/>
var color3 = "#ff9a28"<br/>
//default color: yellow, default hex: #ffff00<br/>
var color4 = "#ffff00"<br/>
//default color: green, default hex: #01b301<br/>
var color5 = "#01b301"<br/>
//default color: blue, default hex: #33ccff<br/>
var color6 = "#33ccff"<br/>
//default color: purple, default hex: #a300a3<br/>
var color7 = "#a300a3"<br/>
