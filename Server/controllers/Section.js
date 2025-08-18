const Section=require('../models/Section');
const Course=require('../models/Course');

exports.createSection=async(req,res)=>{
    try{
        // data fetch
        const {sectionName,courseId}=req.body;

        // data validation
        if(!sectionName||!courseId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            })
        }

        // create section
        const newSection=await Section.create({sectionName});

        // update course with section objectID
        const updatedCourseDetails=await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent:newSection._id,
                }
            },
            {new:true}
            )
            .populate({
                path:"courseContent",
                populate:{
                    path:"subSection",
                },
            }).exec();
            
        // return response
        return res.status(200).json({
            success:true,
            message:'Section created successfully',
            data:updatedCourseDetails,
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to create section',
            error:error.message,
        })
    }
}


exports.updateSection=async(req,res)=>{
    try{
        // data fetch
        const {sectionName,sectionId,courseId}=req.body;

        // data validation
        if(!sectionName||!sectionId||!courseId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            })
        }

        // update data
        await Section.findByIdAndUpdate({_id:sectionId},{sectionName},{new:true})

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
            message:'Section updated successfully',
            data:updatedCourseDetails,
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to update section',
            error:error.message,
        })
    }
}


exports.deleteSection=async(req,res)=>{
    try{
        // get ID - assuming that we are sending ID in params
        const {sectionId,courseId}=req.body;

        // await SubSectionModal.deleteMany({_id:{$in:section.subSection}});
        
        const updatedCourseDetails=await Course.findByIdAndUpdate(
            {_id:courseId},
            {
                $pull:{
                    courseContent:sectionId,
                }
            },
            {new:true},
        )
        
        await Section.findByIdAndDelete(sectionId);

        // return response
        return res.status(200).json({
            success:true,
            data:updatedCourseDetails,
            message:'Section deleted successfully',
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to delete section',
            error:error.message,
        })
    }
}