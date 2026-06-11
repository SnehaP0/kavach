const typeColors = {
  'Emergency': 'dot-red',
  'nonemergency': 'dot-amber',
  'lost': 'dot-blue',
  'found': 'dot-green'
};
const typeBadges = {
  'Emergency': 'emergency',
  'nonemergency': 'unsafe',
  'lost': 'lost',
  'found': 'found'
};
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if(diff < 60) return `${diff}s ago`;
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}
async function loadalerts() {
    try {
        const res = await fetch('/api/alerts');
        const alert = await res.json();
        const active = alert.filter(a => a.status === 'active');
        const underrev = alert.filter(a => a.status === 'under_review');

        document.getElementById('activenum').textContent = active.length;
        document.getElementById('undernum').textContent = underrev.length;

        Alerts('alertsGrid', active, false); 
    } catch(error) {
        console.log(error); 
    }
}

function Alerts(containerid, alerts, expired) { 
    const container = document.getElementById(containerid); 
    if(alerts.length === 0) {
        container.innerHTML = `<div class="empty">${expired ? '📭 No expired alerts' : ' No active alerts'}</div>`;
        return;
    }
    container.innerHTML = alerts.map(a => `
        <a class="alert-card" href="/alert/${a.id}">
          <div class="card-header">
            <div style="display:flex;align-items:flex-start;gap:0.5rem;">
              <div class="type-dot ${typeColors[a.type] || 'dot-amber'}"></div>
              <div class="card-title">${a.title}</div>
            </div>
            <span class="type-badge ${typeBadges[a.type] || 'unsafe'}">${a.type}</span>
          </div>
          <div class="card-footer">
            <span class="location">📍 ${a.location}</span>
            <span class="time">${timeAgo()}</span>
          </div>
        </a>
    `).join('');
}

loadalerts(); 
