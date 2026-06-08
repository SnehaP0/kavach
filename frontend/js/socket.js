
const socket=io();
socket.on('receive-alert',(data)=>{
    console.log('New alert received:', data);
    loadalert();
});