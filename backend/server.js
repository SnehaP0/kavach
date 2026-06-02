import express from "express";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();
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
server.listen(port, () => {
  console.log("Server running on port 5000");
});