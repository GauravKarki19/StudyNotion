const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");



exports.updateCourseProgress = async(req,res)=>{
    const {courseId,subsectionId} = req.body;
    console.log(courseId)
    console.log(subsectionId)
    const userId = req.user.id;

    try{
        // check if subsection is valid
        const subsection = await SubSection.findById(subsectionId);

        if(!subsection){
            return res.status(404).json({
                error:"Invalid subsection"
            })
        }

        // check for old entry
        let courseProgress = await CourseProgress.findOne({
            courseID:courseId,
            userId:userId,
        })

        if(!courseProgress){
            return res.status(404).json({
                success:false,
                message:"Course Progress does not exist"
            })
        }
        else{
            // check for recompleting video/subsection
            if(courseProgress.completedVideos.includes(subsectionId)){
                return res.status(400).json({
                    error:"Subsection already marked completed"
                })
            }

            // push to completed videos
            courseProgress.completedVideos.push(subsectionId);
        }

        await courseProgress.save();

        return res.status(200).json({
            success:true,
            message:"Marked as completed"
        })
    }catch(error){
        console.error(error)
        return res.status(400).json({
            error:"Internal server error"
        })
    }
}