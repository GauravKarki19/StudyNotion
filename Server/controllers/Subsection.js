const SubSection=require('../models/SubSection');
const Section=require('../models/Section');
const {uploadImageToCloudinary}=require("../utils/imageUploader");
const Course = require('../models/Course');
const { getVideoDurationInSeconds } = require('get-video-duration')

// create SubSection
exports.createSubSection=async(req,res)=>{
    try{
        // fetch data from request body
        const {courseId,sectionId,title,description}=req.body;

        // extract file/video
        const video=req.files.video;

        // validation
        if(!courseId||!sectionId||!title||!description||!video){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        // upload video to cloudinary
        const uploadDetails=await uploadImageToCloudinary(video,process.env.FOLDER_NAME);

        const timeDuration=await getVideoDurationInSeconds(
            uploadDetails.secure_url
          )

        console.log(timeDuration)
        // create a sub section
        const subSectionDetails=await SubSection.create({
            title:title,
            description:description,
            timeDuration:timeDuration,
            videoUrl:uploadDetails.secure_url,
        })          
        console.log(subSectionDetails)
        // update section with this subsection objectID
        await Section.findByIdAndUpdate(
            {_id:sectionId},
            {
                $push:{
                    subSection:subSectionDetails._id,
                }
            },
            {new:true},
        ).populate({
            path:"subSection",
        }).exec();

        const updatedCourseDetails=await Course.findById(courseId)
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                },
            }).exec();

        // return response
        return res.status(200).json({
            success:true,
            message:'SUbSection created successfully',
            data:updatedCourseDetails,
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to create subsection',
            error:error.message,
        })
    }
}

exports.updateSubSection=async(req,res)=>{
    try{
        // data fetch
        const {courseId,subSectionId,title,description}=req.body;
        const video=req.files.video;

        console.log(subSectionId)
        console.log(title)
        console.log(description)
        console.log(video)

        // data validation
        if(!courseId||!subSectionId||!title||!description||!video){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            })
        }

        // upload video to cloudinary
        const uploadDetails=await uploadImageToCloudinary(video,process.env.FOLDER_NAME);

        console.log(uploadDetails.secure_url)
        console.log(uploadDetails.secure_url.duration)
        const timeDuration=await getVideoDurationInSeconds(
            uploadDetails.secure_url
          )

        console.log(timeDuration)
        // update data
        await SubSection.findByIdAndUpdate(subSectionId,{
            title,description,timeDuration,
            video:uploadDetails.secure_url},
            {new:true})

        const updatedCourseDetails=await Course.findById(courseId)
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                },
            }).exec();
        
        // return response
        return res.status(200).json({
            success:true,
            data:updatedCourseDetails,
            message:'Subsection updated successfully',
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to update subsection',
            error:error.message,
        })
    }
}

exports.deleteSubSection=async(req,res)=>{
    try{
        // get ID - assuming that we are sending ID in params
        const {sectionId,subSectionId}=req.body;

        
        const updatedSection=await Section.findByIdAndUpdate(
            {_id:sectionId},
            {
                $pull:{
                    subSection:subSectionId,
                }
            },
            {new:true},
        ).populate("subSection").exec();
            
        // find by ID and delete
        await SubSection.findByIdAndDelete(subSectionId)
        
        // return response
        return res.status(200).json({
            success:true,
            data:updatedSection,
            message:'SubSection deleted successfully',
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to delete subsection',
            error:error.message,
        })
    }
}