const Contact = require("../models/Contact")

exports.contactForm=async(req,res)=>{
    try{
        const {firstname,lastname,email,phoneNo,message}=req.body
        if(!firstname||!lastname||!email||!message||!phoneNo){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        const contactform=await Contact.create({firstName:firstname,lastName:lastname,message:message,email:email,contactNumber:phoneNo})
        console.log("contact form",contactform)
        return res.status(200).json({
            success:true,
            data:contactform
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}