const User=require("../models/User");
const OTP=require("../models/OTP");
const otpGenerator=require('otp-generator');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const mailSender=require("../utils/mailSender");
const {passwordUpdated}=require("../mail/templates/passwordUpdate");
const Profile=require("../models/Profile");
require('dotenv').config();

// send OTP
exports.sendotp=async(req,res)=>{

    try{
        // fetch email from request ki body
        const {email}=req.body;

        // check if user already exist
        const checkUserPresent=await User.findOne({email});

        // if user already exist,then return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:'User already registered',
            })
        }

        // generate otp
        var otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })
        console.log("OTP generated: ",otp);

        // check unique OTP or not
        const result=await OTP.findOne({otp:otp})

        while(result){
            otp=otpGenerator(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            })
            result=await OTP.findOne({otp:otp});
        }

        const otpPayload={email,otp};

        // create an entry for OTP
        const otpBody=await OTP.create(otpPayload);
        console.log(otpBody);

        // return response successful
        res.status(200).json({
            success:true,
            message:'OTP sent successfully',
            otp,
        })
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


// sign up
exports.signup=async(req,res)=>{

    try{
        // fetch data from request ki body
        const {firstName,lastName,email,password,confirmPassword
            ,accountType,contactNumber,otp}=req.body;

        // validate krlo
        if(!firstName||!lastName||!email||!password
            ||!confirmPassword||!otp){
                return res.status(403).json({
                    success:false,
                    message:"All fields are required",
                })
        }

        // password match krlo
        if(password!=confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password and ConfirmPassword does not match ,please try again later",
            })
        }

        // check if user already exist
        const existingUser=await User.findOne({email});

        // if user already exist,then return a response
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already registered',
            })
        }

        // find most recent otp stored for the user
        const response=await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(response);

        // validate OTP
        if(response.length==0){
            // OTP not found
            return res.status(400).json({
                success:false,
                message:'OTP not found',
            })
        } else if(otp!=response[0].otp){
            // Invalid OTP
            return res.status(400).json({
                success:false,
                message:'Invalid OTP',
            })
        }

        // Hash password
        const hashedPassword=await bcrypt.hash(password,10);

        // create the user
        let approved="";
        approved==="Instructor"?(approved=false):(approved=true);

        // create an entry in DB
        const profileDetails=await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })

        const user=await User.create({
            firstName,
            lastName,
            email,
            password:hashedPassword,
            accountType:accountType,
            contactNumber,
            additionalDetails:profileDetails._id,
            approved:approved,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        // return response successful
        res.status(200).json({
            success:true,
            message:'User registered successfully',
            user,
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered,please try again",
        })
    }
}


// login
exports.login=async(req,res)=>{

    try{
        // fetch data from request ki body
        const{email,password}=req.body;

        // validate krlo
        if(!email||!password){
                return res.status(403).json({
                    success:false,
                    message:"All fields are required",
                })
        }

        // check if user already exist
        const user=await User.findOne({email}).populate("additionalDetails");

        // if user already exist,then return a response
        if(!user){
            return res.status(400).json({
                success:false,
                message:'User is not registered,please signup',
            })
        }

        // generate JWT,after password matching
        if(await bcrypt.compare(password,user.password)){
            const payload={
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
            const token=jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"2h",
            })
            user.token=token;
            user.password=undefined;

            // create cookie and send response
            const options={
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged in successfully",
            })
        }
        else{
           return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            })
        }

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login failure,please try again",
        })
    }
}


// changePassword
exports.changePassword=async(req,res)=>{
    try{
        const userId=req.user.id
        const{oldPassword,newPassword}=req.body;
        const user=await User.findById(userId)
        
        console.log("old password",oldPassword)
        console.log("db password",user.password)

        if(!oldPassword || !newPassword){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        if(! await bcrypt.compare(oldPassword,user.password)){
            return res.status(401).json({
                success:false,
                message:"Password do not match"
            })
        }

        const hashedPassword=await bcrypt.hash(newPassword,10);

        const updatedUserDetails=await User.findByIdAndUpdate(
            {_id:userId},
            {password:hashedPassword},
            {new:true}
        )

        res.status(200).json({
            success:true,
            message:updatedUserDetails,
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Failed to change password"
        })
    }
}