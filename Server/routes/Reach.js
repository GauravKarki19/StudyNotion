const express=require("express")
const { contactForm } = require("../controllers/Contact")
const router=express.Router()

router.post("/contact",contactForm)

module.exports=router