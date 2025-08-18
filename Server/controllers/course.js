const Course=require("../models/Course");
const Category=require("../models/Categories");
const User=require("../models/User");
const {uploadImageToCloudinary}=require("../utils/imageUploader");
const { default: mongoose } = require("mongoose");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");

// createCourse handler function
exports.createCourse=async(req,res)=>{
    try{
        // fetch data
        const{courseName,courseDescription,tag,instructions,whatYouWillLearn,price,status,category}=req.body;

        console.log("tag",tag)
        console.log("instructions",instructions)

        const tags = tag.split(",")
        console.log("tags",tags)

        // get thumbnail
        const thumbnail=req.files.thumbnailImage;

        // validation
        if(!courseName||!courseDescription||!whatYouWillLearn||!price||!category||!thumbnail||!tag.length||!instructions.length){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            })
        }

        if(!status||status===undefined){
            status="Draft";
        }

        // check for instructor
        const userId=req.user.id;
        console.log("User Id",userId)
        const instructorDetails=await User.findById(userId,{
            accountType:"Instructor",
        });
        console.log("Instructor Details: ",instructorDetails);

        if(!instructorDetails){
            return res.status(400).json({
                success:false,
                message:'Instructor details not found',
            })
        }

        // check given category is valid or not
        const categoryDetails=await Category.findById({_id:category})
        if(!categoryDetails){
            return res.status(400).json({
                success:false,
                message:'Category details not found',
            })
        }
        
        // upload image to cloudinary
        const thumbnailImage=await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

        // create an entry for new course
        const newCourse=await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price,
            category:categoryDetails._id,
            thumbnail:thumbnailImage.secure_url,
            status:status,
            tag:tags,
            instructions:instructions
        })

        
        // add the new course to user schema of instructor
        const updatedUser=await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true},
            ).populate("courses")
            
        // update category schema
        const updatedCategory=await Category.findByIdAndUpdate(
            {_id:category},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true},
        ).populate("courses")


        // return response
        return res.status(200).json({
            success:true,
            message:'Course created successfully',
            data:newCourse
        })

    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to create course',
            error:error.message,
        })
    }

}

exports.editCourse=async(req,res)=>{
    try{
        // fetch data
        const{courseId}=req.body;
        const updates=req.body;

        const course=await Course.findById(courseId)

        // validation
        if(!course){
            return res.status(400).json({
                success:false,
                message:'Course not found',
            })
        }

        // If thumbnail image is found,update it
        if(req.files){
            console.log("Thumbnail updated")
            const thumbnail=req.files.thumbnailImage;
            const thumbnailImage=await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);
            course.thumbnail=thumbnailImage.secure_url
        }

        // update only the fields that are present in request body
        for(const key in updates){
            if(updates.hasOwnProperty(key)){
                if(key==="tag"||key==="instructions"){
                    course[key]=JSON.parse(updates[key])
                }else{
                    course[key]=updates[key]
                }
            }
        }

        await course.save()
            
        const updatedCourse=await Course.findOne(
            {_id:courseId},
        ).populate({
            path:"instructor",
            populate:{
                path:"additionalDetails",
            },
        })
        .populate("category")
        // .populate("ratingAndReviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        }).exec();


        // return response
        return res.status(200).json({
            success:true,
            message:'Course updated successfully',
            data:updatedCourse
        })

    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to update course',
            error:error.message,
        })
    }

}


// getAllCourses handler function
exports.getAllCourses=async(req,res)=>{
    try{
        const allCourses=await Course.find({status:"Published"},
            {courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            ratingAndReviews:true,
            studentsEnrolled:true})
            .populate(
                {
                    path:"instructor",
                    populate:{
                        path:"additionalDetails",
                    }
                }
            )
            .populate("category")
            .populate("studentsEnrolled")
            // .strict("ratingAndReviews")
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                },
            }).exec();
        
        // return response
        return res.status(200).json({
            success:true,
            message:"Data for all courses fetched successfully",
            data:allCourses,
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Cannot fetch course data",
            error:error.message,
        })
    }
}


exports.getFullCourseDetails=async(req,res)=>{
    try{
        const {courseId}=req.body
        console.log("full course details backend",courseId)
        const userId=req.user.id
        const courseDetails=await Course.findOne({_id:courseId})
            .populate(
                {
                    path:"instructor",
                    populate:{
                        path:"additionalDetails",
                    }
                }
            )
            .populate("category")
            // .strict("ratingAndReviews")
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                },
            }).exec();

        let courseProgressCount=await CourseProgress.findOne({
            courseID:courseId,
            userId:userId,
        })

        console.log("courseProgressCount",courseProgressCount)

        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find course with id: ${courseId}`,
            })
        }

        let totalDurationInSeconds=0
        courseDetails.courseContent.forEach((content)=>{
            content.subSection.forEach((subSection)=>{
                const timeDurationInSeconds=parseInt(subSection.timeDuration)
                totalDurationInSeconds+=timeDurationInSeconds
            })
        })

        // const totalDuration=convertSecondsToDuration(totalDurationInSeconds)

        // return response
        return res.status(200).json({
            success:true,
            message:"Course details fetched successfully",
            data:{
                courseDetails,
                totalDurationInSeconds,
                completedVideos:courseProgressCount?.completedVideos
                ? courseProgressCount.completedVideos:[],
            },
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            error:error.message,
        })
    }
}


// getCourseDetails

exports.getCourseDetails=async(req,res)=>{
    try{
        // get id
        const {courseId}=req.body;
        console.log("course id",courseId)

        // find course details
        const courseDetails=await Course.find(
            {_id:courseId}
        )
        .populate(
            {
                path:"instructor",
                populate:{
                    path:"additionalDetails",
                }
            }
        )
        .populate("category")
        // .strict("ratingAndreviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
                // select:"-videoUrl",
            },
        })
        .populate("ratingAndReviews")
        .exec();

        console.log("course details",courseDetails)
        // validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`
            })
        }

        let totalDurationInSeconds=0
        courseDetails[0].courseContent.forEach((content)=>{
            content.subSection.forEach((subSection)=>{
                const timeDurationInSeconds=parseInt(subSection.timeDuration)
                totalDurationInSeconds+=timeDurationInSeconds
            })
        })

        console.log("total duration is",totalDurationInSeconds)
        
        const formatSeconds = s => new Date(s * 1000).toISOString().substr(11, 8).split(":");
        
        const totalDurationInHMSFormat=formatSeconds(totalDurationInSeconds)
        const totalDuration = totalDurationInHMSFormat[0]+" h "+ totalDurationInHMSFormat[1]+" m "+ totalDurationInHMSFormat[2]+" s"
        console.log("total duration ",totalDuration)

        // return response
        return res.status(200).json({
            success:true,
            message:"Course details fetched successfully",
            data:{
                courseDetails,
                totalDuration,
            },
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.getInstructorCourses=async(req,res)=>{
    try{
        const id=req.user.id;
        const instructor=await User.findById(id);
        if(!instructor){
            return res.status(400).json({
                success:false,
                message:"Instructor not found"
            })
        }
        // const instructorCourses=await User.findById(
        //     {_id:id},
        // ).populate(
        //     {
        //         path:"courses",
        //         populate:(
        //             {
        //                 path:"instructor",
        //                 populate:{
        //                     path:"additionalDetails",
        //                 },
        //                 path:"category",
        //                 path:"courseContent",
        //                 path:"studentsEnrolled",
        //                 populate:{
        //                     path:"subSection",
        //                 },
        //             }
        //         )
        //     }
        // )
        // .exec();

        const instructorCourses=await Course.find({instructor:id}).sort({createdAt:-1})

        return res.status(200).json({
            success:true,
            data:instructorCourses,
            message:"Instructor courses fetched successfully"
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.deleteCourse=async(req,res)=>{
    try{
        const {courseId}=req.body;
        if(!courseId){
            return res.status(400).json({
                success:false,
                message:"Course not found"
            })
        }
        await User.findOneAndUpdate(
            {},
            {$pull:{courses:courseId}},
            {new:true}
            )
        await Category.findOneAndUpdate(
            {},
            {$pull:{courses:courseId}},
            {new:true}
        )
        const course=await Course.findById({_id:courseId})
        const section=course.courseContent
        
            section.forEach(async(sectionid)=>(
                await Section?.findById({_id:sectionid})?.
                subSection?.forEach(async(subsectionid)=>(
                await SubSection.findByIdAndDelete({_id:subsectionid})
            ))))
                
            section.forEach(async(sectionid)=>(
            await Section.findByIdAndDelete({_id:sectionid})
            ))
        
        await Course.findByIdAndDelete({_id:courseId})
        return res.status(200).json({
            success:true,
            message:"Course deleted successfully"
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Failed to delete the course",
            error:error.message
        })
    }
}