async function log(e){
    e.preventDefault();
    const username=document.getElementById("mail").value;
    const password=document.getElementById("pass").value;
    const name=document.getElementById("name").value; 
    const user_data={username:username,password:password,name:name};
    try{
        const res= await fetch('/api/auth/register',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(user_data)
    });
    const result=await res.json();
       
    if(!res.ok){
        throw new Error('failed to sign in');}
    else {
    console.log(result.message);
    window.location.href = '/dashboard'; 
}
       

}catch(error){
    console.log('Error:',error);
        
}
}
document.getElementById("cr").addEventListener('click',log);

