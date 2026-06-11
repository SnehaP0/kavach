import 'dotenv/config';
import express from "express";
import { Server } from "socket.io";
import http from "http";
import { pool } from "./db.js";
import session from "express-session";
import {Strategy} from "passport-local";
import passport from "passport";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import cron from 'node-cron';

const app=express();
app.use(express.json()); 

const server = http.createServer(app);
const port=process.env.PORT|| 5000;
app.use(express.urlencoded({ extended: true }));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false
}));
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(passport.initialize());
app.use(passport.session());
const salt=12;


app.get("/land",(req,res)=>{
    if(req.isAuthenticated()){
        res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
    }
    else{
         res.sendFile(path.join(__dirname, "../frontend/pages/login.html"));
    }
});


const io=new Server(server);
app.set('io', io);
io.on("connection",(client)=>{
    client.on("event",(data)=>{
        console.log(data);
    });
    client.on("disconnect", () => {
    console.log("User disconnected");
    });
});
passport.use(new Strategy ( async function verify(username,password,cb){
    try{
        const result =await pool.query('SELECT * FROM users WHERE email=$1',[username]);
        if(result.rowCount>0){
            const user=result.rows[0];
            const stored_pass=user.password;
            bcrypt.compare(password,stored_pass, (err,result)=>{
                if(err){
                    return cb(err)
                }
                else{
                    if(result){
                        return cb(null,user)
                    }
                    else{
                        return cb("user not found");
                    }
                }

            })
        }
        else{
              return cb(null, false, { message: "User not found" });
        }}
        catch(err){
            return cb(err);
        } 
}));
passport.serializeUser((user,cb)=>{
            cb(null,user);
        });
        passport.deserializeUser((user,cb)=>{
            cb(null,user);
        });
function isAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


cron.schedule('0 * * * *', async () => {
    await pool.query(
        "DELETE FROM alerts WHERE expires_at < NOW()"
    );
    console.log('Expired alerts cleaned up');
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/register.html"));
});
app.get("/dashboard", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/dashboard.html"));
});

app.get("/map",isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/map.html"));
});
app.get('/alerts', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/alerts.html'));
});
app.get('/api/alerts/my', isAuthenticated, async (req, res) => {
    try{
        const alerts = await pool.query(
            'SELECT * FROM alerts WHERE user_id=$1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(alerts.rows);
    } catch(err){
        res.status(500).json({error: err.message});
    }
});

app.get("/api/alerts",isAuthenticated,async (req,res)=>{
    try{
        const alerts= await pool.query("SELECT * FROM alerts");
        res.json(alerts.rows);
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});
app.post("/api/alerts", isAuthenticated, async (req,res)=>{
    try{
    const title =req.body.title;
    const type=req.body.type;
    const location=req.body.location;
    const latitude=req.body.latitude;
    const longitude=req.body.longitude;
    const remarks=req.body.remarks;
    const user_id=req.user.id;
    const status = 'active';
    const qer = await pool.query('INSERT INTO alerts (title, type, location, latitude, longitude, remarks, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[title, type, location, latitude, longitude, remarks, status, user_id,]);
    res.json(qer.rows[0]);
    const io = req.app.get('io');
    io.emit('receive-alert', qer.rows[0]);
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});
app.get("/api/alerts/:id", isAuthenticated,async (req,res)=>{
    try{
        const i=req.params.id;
        const qer=await pool.query('SELECT * FROM alerts WHERE id =$1',[i]);
        if (qer.rows.length === 0) {
        return res.status(404).json({
        error: "Alert not found"
      });
    }
        res.json(qer.rows[0]);
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});

app.delete("/api/alerts/:id",isAuthenticated,async (req,res)=>{
   try{ const i=req.params.id;
    const qer=await pool.query('DELETE FROM alerts WHERE id=$1',[i]);
    if(qer.rowCount === 0){
        return res.status(404).json({error: "Alert not found"});
    }
    return res.status(200).json({
        message:"succesful"
    });
    }
    catch(err){
        res.status(505).json({error:err.message});
    }
});

app.patch("/api/alerts/:id/upvote",isAuthenticated,async (req,res)=>{
    try{
    const i=req.params.id;
    const upvote_id = req.user.id; 
    const qr= await pool.query('SELECT * FROM upvotes WHERE user_id=$1 AND alert_id=$2',[upvote_id,i]);
    if(qr.rowCount != 0){
        await pool.query('DELETE FROM upvotes WHERE user_id=$1 AND alert_id=$2',[upvote_id,i]);
        await pool.query('UPDATE alerts SET upvote_count=upvote_count-1 WHERE id=$1',[i]);
    }
    else{
        await pool.query('INSERT INTO upvotes(user_id,alert_id) VALUES ($1,$2)',[upvote_id,i]);
        await pool.query('UPDATE alerts SET upvote_count=upvote_count+1 WHERE id=$1',[i]);
    }
    res.json({message: "upvote updated"});
}
    catch(err){
        res.status(500).json({error:err.message});
    }
});
app.post("/api/alerts/:id/flag",isAuthenticated,async (req,res)=>{
    try{
        const i=req.params.id;
        const upvote_id=req.user.id;
        const qr= await pool.query('SELECT * FROM flags WHERE alert_id=$1 AND user_id=$2',[i,upvote_id]);
        if(qr.rowCount>0){
            await pool.query('DELETE FROM flags WHERE user_id=$1 AND alert_id=$2',[upvote_id,i]);
            await pool.query('UPDATE alerts SET flag_count=flag_count-1 WHERE id=$1',[i]);
         }
         else{
            await pool.query('INSERT INTO flags(user_id,alert_id) VALUES ($1,$2)',[upvote_id,i]);
        await pool.query('UPDATE alerts SET flag_count=flag_count+1 WHERE id=$1',[i]);

         }
         const al=await pool.query('SELECT flag_count FROM alerts WHERE id=$1',[i]);
         const count=al.rows[0].flag_count;
         if(count>=5){
        await pool.query("UPDATE alerts SET status='under_review' WHERE id=$1",[i]);}
         res.json({message: "flag updated", flag_count: count});
    
    }catch(err){
        res.status(500).json({error:err.message});
    }
});
app.post("/api/alerts/:id/comments",isAuthenticated, async (req,res)=>{
    try{
        const i=req.params.id;
        const upvote_id = req.user.id; 
        const comm=req.body.text;
        await pool.query('INSERT INTO comments(alert_id,user_id,text) VALUES ($1,$2,$3)',[i,upvote_id,comm]);
        res.status(200).json({message:comm});
        }
    catch(err){
        res.status(500).json({error: err.message});
    }
});
app.post("/api/auth/login",passport.authenticate("local",{
    successRedirect:"/dashboard",
    failureRedirect:"/login"
}));

app.post("/api/auth/register",async (req,res)=>{
    console.log(req.body);
    const email=req.body.username;
    const password=req.body.password;
    const name=req.body.name;

    try{
        if(!email.endsWith("@kiit.ac.in")){
    return res.send("Only KIIT emails allowed!");
        }
        const check=await pool.query('SELECT * FROM users WHERE email=$1',[email]);
        if(check.rowCount>0){
            res.send("Acoount already exists");
        }
        else{
            bcrypt.hash(password,salt,async(err,hash)=>{
                if(err){
                     return res.send(err.message);
                }
                const result= await pool.query('INSERT INTO users(name,email,password) VALUES ($1,$2,$3) RETURNING *',[name,email,hash]);
                const user=result.rows[0];
                req.logIn(user,(err)=>{
                    if(err){return res.send(err);}
                    res.status(200).json({ message: "Account created successfully" });
                });
            });
        }
    }
    catch(err){
        res.send(err);
    }
});
app.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

server.listen(port, () => {
  console.log("Server running on port 5000");
});