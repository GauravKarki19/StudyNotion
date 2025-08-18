const {instance}=require("../config/razorpay");
const Course=require("../models/Course");
const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const {courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
require('dotenv').config();
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");
const paymentSuccessEmail = require("../mail/templates/paymentSuccessEmail");




exports.capturePayment=async(req,res)=>{
    const {courses}=req.body;
    const userId=req.user.id;

    // const courses=["65f9641114dff0e16ae130f7"]

    console.log("courses in capture payment",courses)

    if(courses.length===0){
        return res.status(400).json({
            success:false,
            message:"Please provide course id",
        })
    }
    console.log("courses payment",courses)
    let totalAmount=0;
    for(const course_ids of courses){
        let ans;
        console.log("cpurse id",course_ids)
        for(const course_id of course_ids){

            try{
                ans=await Course.find(
                    {_id:course_id}
                )
                console.log("course found or not ",ans)
                if(!ans[0]){
                    return res.status(400).json({
                        success:false,
                        message:"Course not found",
                    })
                }
                const uid=new mongoose.Types.ObjectId(userId);
                if(ans[0]?.studentsEnrolled?.includes(uid)){
                    return res.status(400).json({
                        success:false,
                        message:"Student is already enrolled",
                    })
                }
    
                totalAmount+=ans[0].price;
                console.log("total amount",totalAmount)
            }catch(error){
                return res.status(500).json({
                    success:false,
                    message:error.message,
                })
            }
        }
    }
    const options={
        amount:totalAmount*100,
        currency:"INR",
        receipt:Math.random(Date.now()).toString(),
    }

    console.log("options",options)

    try{
        // initiate the payment using razorpay
        const paymentResponse=await instance.orders.create(options);
        console.log("payment response",paymentResponse);
        
        // return response
        return res.status(200).json({
            success:true,
            message:paymentResponse,
        })
        
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"COuld not initiate order",
        })
    }
}


exports.verifySignature=async(req,res)=>{
    console.log("hello")
    const razorpay_order_id=req.body?.razorpay_order_id;
    const razorpay_payment_id=req.body?.razorpay_payment_id;
    const razorpay_signature=req.body?.razorpay_signature;
    const courses=req.body?.courses;
    const userId=req.user.id;
    
    if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!courses||!userId){
        return res.status(200).json({
            success:false,
            message:"Payment failed"
        })
    }
    
    console.log("hello1")
    let body=razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature=crypto
    .createHmac("sha256",process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");
    
    console.log("hello2")
    if(expectedSignature===razorpay_signature){
        await enrollStudents(courses,userId,res);
        
        return res.status(200).json({
            success:true,
            message:"Payment verified",
        })
    }
    console.log("hello3")
    return res.status(200).json({
        success:false,
        message:"Payment failed",
    })
}

const enrollStudents=async(courses,userId,res)=>{
    console.log("hello4")
    if(!courses||!userId){
        return res.status(400).json({
            success:false,
            message:"Please provide data for courses or userid",
        })
    }
    console.log("hello5",courses)
    for(const courseIds of courses){
        for(const courseId of courseIds){

            try{
                console.log("hello7",courseId)
                const enrolledCourse=await Course.findOneAndUpdate(
                    {_id:courseId},
                    {$push:{studentsEnrolled:userId}},
                    {new:true},
                )
                if(!enrolledCourse){
                    return res.status(400).json({
                        success:false,
                        message:"Course not found",
                    })            
                }

                console.log("hello8")
    
                const courseProgress = await CourseProgress.create({
                    courseID:courseId,
                    userId:userId,
                    completedVideos:[]
                })
                console.log("hello6")
                const enrolledStudent=await User.findByIdAndUpdate(userId,
                    {$push:
                        {courses:courseId,
                        courseProgress:courseProgress._id},
                    },
                    {new:true})
                    
                    console.log("hello111",enrolledStudent)
                    const emailResponse=await mailSender(
                        enrolledStudent.email,
                        `Successfully enrolled into ${enrolledCourse.courseName}`,
                        courseEnrollmentEmail(enrolledCourse.courseName,`${enrolledStudent.firstName}`)
                    )
                    console.log("Email sent successfully",emailResponse.response)
                }catch(error){
                    console.log(error);
                    res.status(500).json({
                        success:false,
                        message:error.message,
                })
            }
        }
    }
}

exports.sendPaymentSuccessEmail=async(req,res)=>{
    const {orderId,paymentId,amount}=req.body;
    const userId=req.user.id;
    if(!orderId||!paymentId||!amount||!userId){
        return res.status(400).json({
            success:false,
            message:"Please provide all the fields"
        })
    }
    
    try{
        const enrolledStudent=await User.findById(userId);
        await mailSender(enrolledStudent.email,'Payment Recieved',paymentSuccessEmail(`${enrolledStudent.firstName}`,
        amount/100,orderId,paymentId))
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Could not send email",
        })
    }
}


// // capture the payment and initiate the Razorpay order
// exports.capturePayment=async(req,res)=>{
//     // get courseID and userID
//     const {course_id}=req.body;
//     const userId=req.user.id;

//     // validation

//     // valid courseID
//     if(!course_id){
//         return res.json({
//             success:false,
//             message:"Please provide valid course ID",
//         })
//     }
//     // valid courseDetail
//     let course;
//     try{
//         course=await Course.findById(course_id);
//         if(!course){
//             return res.json({
//                 success:false,
//                 message:"Could not find the course",
//             })
//         }

//     // user already pay for the same course
//     const uid=new mongoose.Types.ObjectId(userId);
//     if(course.studentsEnrolled.includes(uid)){
//         return res.status(400).json({
//             success:false,
//             message:"Student is already enrolled",
//         })
//     }
    
//     }catch(error){
//         console.error(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })
//     }

//     // order create
//     const amount=course.price;
//     const currency="INR";
//     const options={
//         amount:amount*100,
//         currency,
//         receipt:Math.random(Date.now()).toString(),
//         notes:{
//             courseId:course_id,
//             userId,
//         }
//     }

//     try{
//         // initiate the payment using razorpay
//         const paymentResponse=await instance.orders.create(options);
//         console.log(paymentResponse);

//         // return response
//         return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail:course.thumbnail,
//             orderId:paymentResponse.id,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount,
//         })

//     }catch(error){
//         console.log(error);
//         res.json({
//             success:false,
//             message:"COuld not initiate order",
//         })
//     }
// }

// // verify signature of Razorpay and Server

// exports.verifySignature=async(req,res)=>{
//     const webhookSecret="12345678";

//     const signature=req.headers("x-razorpay-signature");

//     const shasum=crypto.createHmac("sha256",webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest=shasum.digest("hex");

//     if(signature===digest){
//         console.log("Payment is authorised");

//         const {courseId,userId}=req.body.payload.entity.notes;

//         try{
//             // fulfill the action

//             // find the course and enroll the student in it
//             const enrolledCourse=await Course.findOneAndUpdate(
//                 {_id:courseId},
//                 {$push:{studentsEnrolled:userId}},
//                 {new:true},
//             )

//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Course not found",
//                 })
//             }

//             console.log(enrolledCourse);

//             // find the student and add the course to their list enrolled courses me
//             const enrolledStudent=await User.findOneAndUpdate(
//                 {_id:userId},
//                 {$push:{courses:courseId}},
//                 {new:true},
//             )

//             console.log(enrolledStudent);

//             // mail send krdo confirmation wala
//             const emailResponse=await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from CodeHelp",
//                 "Congratulations, you are onboarded into new CodeHelp Course",
//             )

//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature verified and Couse added",
//             })
//         }catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })
//         }
//     }
//     else{
//         return res.status(500).json({
//             success:false,
//             message:"Invalid signature",
//         })
//     }
// }