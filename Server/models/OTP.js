const mongoose=require('mongoose');
const mailSender = require('../utils/mailSender');

const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:50*60*1000,
    },
})

async function sendVerificationEmail(email,otp){
    try{
        const mailResponse=await mailSender(email,"Verification email from TechnoStudy",otp);
        console.log("Email sent successfully",mailResponse);
    }catch(error){
        console.log("error occured while sending mails",error);
        throw error;
    }
}

otpSchema.pre("save",async function(next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports=mongoose.model("OTP",otpSchema);