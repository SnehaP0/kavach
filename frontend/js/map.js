import { socket } from './socket.js';
const map = L.map('map', {minZoom:2}).setView([20.3549, 85.8198], 15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
}).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB',
    opacity: 0.9
}).addTo(map);

let lat;
let lng;
var frmtrue=true;


const campus=[
    {name:"CAMPUS 6 KOSI",lat:20.353530885325306, lng:85.81955435922184},
    {name:"CAMPUS 1 KOEL ",lat:20.34632823227217, lng:85.82363965951892},
    {name:"CAMPUS 2 KOLAB",lat:20.35351760553785, lng:85.81981790344184},
    {name:"CAMPUS 3 KATHAJODI",lat:20.353943873892423, lng:85.81657041534174},
    {name:"CAMPUS 5 KUSABHADRA",lat:20.35418857570376, lng:85.82002564577094},
    {name:"CAMPUS 7 KRISHNA",lat:20.350919912394414, lng:85.81956166848006},
    {name:"CAMPUS 8 KAVERI",lat:20.351407605229696, lng:85.81940510483288},
    {name:"CAMPUS 9 KIIT INTERNATIONAL SCHOOL",lat:20.353689274306966, lng:85.81163675767088},
    {name:"CAMPUS 10 KP10-B",lat:20.354834872441618, lng:85.81625647103745},
    {name:"CAMPUS 11 KUNDALI",lat:20.358395327918874,lng: 85.82171652777426},
    {name:"CAMPUS 12 KODOOR",lat:20.358395327918874,lng: 85.82171652777426},
    {name:"CAMPUS 13 KARMANSHA",lat:20.356780340287948, lng:85.81856121521459},
    {name:"CAMPUS 14 KALADAN",lat:20.356325740761747, lng:85.81527645582283},
    {name:"CAMPUS 15 KALLAYAI",lat:20.348509861220037,lng: 85.81602747426471},
    {name:"CAMPUS 16 KANGSABATI",lat:20.362263577188386, lng:85.82290730000001},
    {name:"CAMPUS 17 ARCHITECTURE",lat:20.348660750657636, lng:85.81950361718542},
    {name:"CAMPUS 18 SCHOOL OF FILM",lat:20.355992839631078,lng: 85.82404807492868},
    {name:"CAMPUS 19 SCHOOL OF FASHION AND DESIGN",lat:20.356391099492544, lng:85.8239340441772},
    {name:"CAMPUS 20 CENTRAL LIBRARY",lat:20.35411807392224,lng: 85.81636481786913},
    {name:"CAMPUS 22 INOVATION CENTRE",lat:20.354316144357284,lng: 85.8146928524315},
    {name:"CAMPUS 25 KIIT SCHOOL OF COMPUTER SCIENCE ENGINEERING",lat:20.364554105843908, lng:85.81698073045563},
    
      
];
const alertLayer = L.layerGroup().addTo(map);
campus.forEach(build=>{
    L.marker([build.lat,build.lng])
    .addTo(map)
    .bindTooltip(build.name,{
        permanent:true,
        direction:'center',
        className:'buildinglabel',
        offset: [0, -10]
    });

});
export async function loadalert(){
    try{
        const res=await fetch('/api/alerts');
        if(!res.ok){
            throw new Error('HTTP error!');}
            const data=await res.json();
            alertLayer.clearLayers();
            data.forEach(alerts=>{
                const icons = {
        'Emergency': '🚨',
        'nonemergency': '⚠️'
    };
    const alertIcon = L.divIcon({
        html: `<div style="font-size:24px;">${icons[alerts.type] || '📍'}</div>`,
        className: '', // avoid default leaflet divIcon styling
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    
    
    L.marker([alerts.latitude, alerts.longitude], { icon: alertIcon })
        .addTo(alertLayer)
        .bindPopup(`<b>${alerts.title}</b><br>${alerts.remarks}`);
            });
        }catch(error){
             console.error('Fetch failed:', error);

        }
    }
loadalert();

socket.on('receive-alert', (data) => {
    console.log('New alert received:', data);
    loadalert();
});

socket.on('alert-expired', (data) => {
    console.log('Alert expired:', data.id);
    loadalert();
});

socket.on('alert-deleted', (data) => {
    console.log('Alert deleted:', data.id);
    loadalert();
});
function frm(){
    if(frmtrue==true){
    document.getElementById("form").classList.toggle("hidden");
    map.once('click',getlat);
    console.log(frmtrue);
    frmtrue=false;
    }
    else{
        document.getElementById("form").classList.toggle("hidden");
        map.off('click',getlat);
        frmtrue=true;
    }
    
}
document.getElementById("rprt").addEventListener("click",frm);

function getlat(e){
lat = e.latlng.lat;
lng = e.latlng.lng;
var temp=L.marker([lat,lng]).addTo(map);
}

async function sub(e){
    e.preventDefault();

    const utitle = document.getElementById("title").value.trim();
    const utypeEl = document.querySelector('input[name="type"]:checked');
    const uloacation = document.getElementById("location").value.trim();
    const uremarks = document.getElementById("remarks").value.trim();
    const ustatusEl = document.querySelector('input[name="status"]:checked');
    const errorEl = document.getElementById("formError");

    if (!utitle || !utypeEl || !uloacation || !uremarks || !ustatusEl || !lat || !lng) {
        errorEl.textContent = "Please fill in all fields and select a location on the map.";
        errorEl.classList.remove("hidden");
        return;
    }
    errorEl.classList.add("hidden");

    const utype = utypeEl.value;
    const ustatus = ustatusEl.value;
    const userData = { title: utitle, type: utype, location: uloacation, remarks: uremarks, status: ustatus, latitude: lat, longitude: lng };
    
    try{
        const response= await fetch('/api/alerts',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify(userData)
        });
        if(!response.ok){
            throw new Error('Failed to create alert');}
            const result=await response.json();
            console.log('sucess:',result);
            frmtrue=true;
            loadalert();
            document.getElementById("form").classList.toggle("hidden");
            }
        catch(error){
            console.log('Error:',error);
            errorEl.textContent = "Something went wrong submitting your report.";
            errorEl.classList.remove("hidden");
        }
}
document.getElementById("submit").addEventListener("click",sub);






