const User=require("../model/user.model");
const {randomBytes} = require("crypto");
const {createConnection} = require("../database/DB.database");
const bcrypt = require('bcrypt');

const allUsers= async (req,res)=>{
    const users=await User.find();
    res.status(200).json({users, toal_users:users.length});
}

const newUser=async (req, res)=>{
    const {name, age, email, password}=req.body;
    if(!name || !age || !email || !password){
        return res.status(400).json({message:"All fields are required"});
    }
    const userExists=await User.findOne({email});
    if(userExists){
        return res.status(400).json({message:"User already exists"});
    }
    const user=new User({name, age, email, password});
    await user.save();
    res.status(201).json({message:"User created successfully", user});
}

const updateUser=async (req, res)=>{
    const {id}=req.params;
    const {name, age, email, password}=req.body;
    const user=await User.findByIdAndUpdate(id, {name, age, email, password}, {new:true});
    res.status(200).json({message:"User updated successfully", user});
}

const resetpassword=async (req, res)=>{
    const {id}=req.params;
    const {password}=req.body;
    const user=await User.findByIdAndUpdate(id, {password, salt:randomBytes(16).toString('hex')}, {new:true});
    res.status(200).json({message:"Password reset successfully", user});
}

const deleteUser=async (req, res)=>{
    const {id}=req.params;
    const user=await User.findByIdAndUpdate(id, {isDeleted:true}, {new:true});
    res.status(200).json({message:"User deleted successfully", user});
}

const login=async (req, res)=>{
    const {email, password}=req.body;
    const user=await User.findOne({email});
    if(!user){
        return res.status(400).json({message:"User not found"});
    }
    const isPasswordCorrect=await bcrypt.compare(password, user.password);
    res.status(200).json({message:"Login successful", user});
}

const dbconnection=async (req, res)=>{
    try {
        const { mongoUri } = req.body;
        await createConnection(mongoUri);
        res.json({
          message: "External DB connected successfully",
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
}

module.exports={allUsers, newUser, updateUser, resetpassword, deleteUser, login, dbconnection};
