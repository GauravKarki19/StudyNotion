const mongoose=require('mongoose');
const mailSender = require('../utils/mailSender');

const contactSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        trim:true,
    },
    contactNumber:{
        type:Number,
        required:true,
        minLength:10,
        maxLength:12,
    },
    message:{
        type:String,
        required:true,
    },
})

async function sendVerificationEmail(email){
    try{
        const mailResponse=await mailSender(email,"Mail from TechnoStudy","Do not reply to this mail. <br/> We will reach to you shortly");
        console.log("Email sent successfully",mailResponse);
    }catch(error){
        console.log("error occured while sending mail",error);
        throw error;
    }
}

contactSchema.post("save",async function(next){
    await sendVerificationEmail(this.email);
    // next();
})

module.exports=mongoose.model("Contact",contactSchema);