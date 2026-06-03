import express from "express";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();
const upvote_id=1;// for now till auth is established
const app=express();
const server = http.createServer(app);
const port=process.env.PORT|| 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const io=new Server(server);
io.on("connection",(client)=>{
    client.on("event",(data)=>{
        console.log(data);
    });
    client.on("disconnect", () => {
    console.log("User disconnected");
    });
});

app.get("/",(req,res)=>{
    res.send("<h1>API is running</h1>");
});
app.get("/api/alerts",async (req,res)=>{
    try{
        const alerts= await pool.query("SELECT * FROM alerts");
        res.json(alerts.rows);
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});
app.post("/api/alerts", async (req,res)=>{
    try{
    const title =req.body["title"];
    const type=req.body["type"];
    const location=req.body["location"];
    const latitude=19.0760;
    const longitude=20.4284;
    const remarks=req.body["remarks"];
    const status=req.body["status"];
    const user_id=1;
    const qer = await pool.query('INSERT INTO alerts (title, type, location, latitude, longitude, remarks, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[title, type, location, latitude, longitude, remarks, status, user_id,]);
    res.json(qer.rows[0]);}
    catch(err){
        res.status(500).json({error:err.message});
    }
});
app.get("/api/alerts/:id",async (req,res)=>{
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

app.delete("/api/alerts/:id", async (req,res)=>{
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

app.patch("/api/alerts/:id/upvote", async (req,res)=>{
    try{
    const i=req.params.id;
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

app.post("/api/alerts/:id/comments", async (req,res)=>{
    try{
        const i=req.params.id;
        const comm=req.body.text;
        await pool.query('INSERT INTO comments(alert_id,user_id,text) VALUES ($1,$2,$3)',[i,upvote_id,comm]);
        res.status(200).json({message:comm});
        }
    catch(err){
        res.status(500).json({error: err.message});
    }
});
server.listen(port, () => {
  console.log("Server running on port 5000");
});