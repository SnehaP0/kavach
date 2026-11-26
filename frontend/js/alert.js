
let detailMap;

function renderDetailMap(alertData){
    if (!detailMap) {
        const container = document.getElementById('detail-map');
        container.innerHTML = ''; // only clear the placeholder the very first time

        detailMap = L.map('detail-map', {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false
        }).setView([alertData.latitude, alertData.longitude], 16);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }).addTo(detailMap);
    } else {
        detailMap.setView([alertData.latitude, alertData.longitude], 16);
    }

    const icons = { 'Emergency': '🚨', 'nonemergency': '⚠️' };
    const alertIcon = L.divIcon({
        html: `<div style="font-size:24px;">${icons[alertData.type] || '📍'}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    if (detailMap._alertMarker) {
        detailMap.removeLayer(detailMap._alertMarker);
    }
    detailMap._alertMarker = L.marker([alertData.latitude, alertData.longitude], { icon: alertIcon }).addTo(detailMap);

    document.querySelector('.location-name').textContent = `📍 ${alertData.location}`;
}
async function loadalert(){
    try{
     const id = window.location.pathname.split('/')[2]; 
    const alert = await fetch(`/api/alerts/${id}`); 
    const res=await alert.json();
     document.getElementById('emer').textContent = res.type;
        const statEl = document.getElementById('stat');
if (res.status === 'under_review') {
    statEl.textContent = '⚠ Under Review';
    statEl.classList.add('status-review');
    statEl.classList.remove('status-badge');
} else if (res.status === 'active') {
    statEl.textContent = '● Active';
    statEl.classList.add('status-badge');
    statEl.classList.remove('status-review');
} else {
    statEl.textContent = res.status;
}
         document.getElementById('title').textContent = res.title;
         document.getElementById('remark').textContent = res.remarks;
         document.getElementById('loc').textContent =  `📍 ${res.location}`;
         document.getElementById('time').textContent = res.created_at;
         document.getElementById('up').textContent = `▲ Upvote · ${res.upvote_count}`

    renderDetailMap(res);

    } catch(error) {
        console.log(error); 
    }
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if(diff < 60) return `${diff}s ago`;
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

async function loadcomment(){
    try{
        const id = window.location.pathname.split('/')[2]; 
        const res = await fetch(`/api/alerts/${id}/comments`);

    
    const comments_data = await res.json();
    comments('commentsList', comments_data); }
    catch(error) {
        console.log(error); 
    }
}
function comments(containerid, alerts) { 
    const container = document.getElementById(containerid); 
    container.innerHTML = alerts.map(a =>`  
        <div class="comment">
            <div class="comment-avatar">${a.name.charAt(0)}</div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-name">${a.name}</span>
                    <span class="comment-time">${timeAgo(a.created_at)}</span>
                </div>
            <div class="comment-text">${a.text}</div>
            </div> 
        </div>`).join('');}

async function sub(e){
    e.preventDefault();
    const utitle=document.getElementById("urcom").value;
    const id= window.location.pathname.split('/')[2]; 
    const userData={text:utitle};
    try{
        const response= await fetch(`/api/alerts/${id}/comments`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify(userData)
        });
        if(!response.ok){
            throw new Error('Failed to create comment');}
            const result=await response.json();
            console.log('sucess:',result);
            document.getElementById("urcom").value = ''; // clear textarea
await loadcomment();
            }

        catch(error){
            console.log('Error:',error);
        }

}
async function upvote(e){
    const id= window.location.pathname.split('/')[2]; 
    try{
        const response= await fetch(`/api/alerts/${id}/upvote`,{
            method:'PATCH',
            headers:{
                'Content-Type':'application/json'
            },
        });
        if(!response.ok){
            throw new Error('Failed to create comment');}
            const result=await response.json();
            console.log('sucess:',result);
await loadalert();
            }

        catch(error){
            console.log('Error:',error);
        }
    

}
async function flg(e){
    const id = window.location.pathname.split('/')[2]; 
    const flagBtn = document.getElementById("flag");
    try{
        const response = await fetch(`/api/alerts/${id}/flag`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if(!response.ok){
            throw new Error('Failed to flag alert');
        }
        const result = await response.json();
        console.log('success:', result);

        flagBtn.classList.toggle('flagged');

        await loadalert();
    }
    catch(error){
        console.log('Error:', error);
    }
}
async function loadUser() {
  try {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) {
      window.location.href = "login.html";
      return;
    }
    const user = await res.json();
    document.getElementById("userName").textContent = ", " + user.name;
  } catch (err) {
    console.error(err);
  }
}
loadUser();
document.getElementById("sub").addEventListener("click",sub);
document.getElementById("up").addEventListener("click",upvote);
document.getElementById("flag").addEventListener("click",flg);


loadcomment();
loadalert();