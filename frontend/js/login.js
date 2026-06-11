async function log(){
    e.preventDefault();
    const username=document.getElementById("mail").value;
    const password=document.getElementById("pass").value;
    user_data={username:username,password:password}.value;
    try{
        const res= await fetch('/api/auth/login',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(user_Data)
    });
    const result=await response.json();
    if(!res.ok){
        throw new Error('failed to log in');}
        else {
    console.log(result.message);
    window.location.href = '/dashboard'; 
}
    
}catch(error){
    console.log('Error:',error);
        
}
}
document.getElementById("submit-btm").addEventListener('click',log);

