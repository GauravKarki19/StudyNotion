const { cloudinaryConnect } = require("../config/cloudinary");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");
const Profile=require("../models/Profile");
const User=require("../models/User");
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require("../utils/imageUploader");

exports.updateProfile=async(req,res)=>{
    try{
        // get data
        const{dateOfBirth="",about="",contactNumber,gender}=req.body;

        // get userId
        const id=req.user.id;

        // validation
        if(!contactNumber||!gender||!id){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            })
        }

        // find profile
        const userDetails=await User.findById(id);
        const profileId=userDetails.additionalDetails;
        const profileDetails=await Profile.findById(profileId);

        // update profile
        profileDetails.dateOfBirth=dateOfBirth;
        profileDetails.about=about;
        profileDetails.gender=gender;
        profileDetails.contactNumber=contactNumber;
        console.log(profileDetails)
        await profileDetails.save();

        // return response
        return res.status(200).json({
            success:true,
            message:'Profile updated successfully',
            data:profileDetails,
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to update profile',
            error:error.message,
        })
    }
}


// delete account
exports.deleteAccount=async(req,res)=>{
    try{
        // get id
        const id=req.user.id;

        // validation
        const userDetails=await User.findById({_id:id});
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:'User not found',
            })
        }

        // delete profile
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});

        // delete user
        await User.findByIdAndDelete({_id:id});

        // return response
        return res.status(200).json({
            success:true,
            message:'User account deleted successfully',
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to delete user account',
            error:error.message,
        })
    }
}


exports.getAllUserDetails=async(req,res)=>{
    try{
        // get id
        const id=req.user.id;
        console.log(id)

        // validation
        const userDetails=await User.findById({_id:id})
        .populate("additionalDetails")
        .populate("courses")
        // .populate("studentsEnrolled")
        .exec();
        
        // return response
        return res.status(200).json({
            success:true,
            data:userDetails,
            message:'User data fetched successfully',
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch user data',
            error:error.message,
        })
    }
}

exports.updateDisplayPicture=async(req,res)=>{
    try{
        const userId=req.user.id;
        console.log(userId)
        const userDetails=await User.findById({_id:userId});
        console.log(userDetails)
        const oldurl=userDetails.image;
        console.log(oldurl)
        // await deleteImageFromCloudinary(oldurl,process.env.FOLDER_NAME);
        const updatedImage=req.files.displayPicture;
        console.log(updatedImage)
        const uploadDetails=await uploadImageToCloudinary(updatedImage,process.env.FOLDER_NAME);
        console.log(uploadDetails.secure_url)
        const updatedProfile=await User.findByIdAndUpdate(
            {_id:userId},
            {
                image:uploadDetails.secure_url,
            },
            {new:true}
        )
        res.status(200).json({
            success:true,
            data:updatedProfile
        })
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Profile picture can not be updated"
        })
    }
}

exports.getEnrolledCourses=async(req,res)=>{
    try{
        console.log("111")
        const userId=req.user.id;
        console.log("112")
        const userDetails=await User.findOne({
            _id:userId,
        })
        .populate(
            {
                path:"courses",
                populate:(
                    {
                        path:"instructor",
                        populate:{
                            path:"additionalDetails",
                        },
                        path:"category",
                        path:"courseContent",
                        populate:{
                            path:"subSection",
                        },
                    }
                )
            }
            
        )
        .exec();
        
        console.log("113")
            
        const formatSeconds = s => new Date(s * 1000).toISOString().substr(11, 8).split(":");
        
        console.log("1")
        // userDetails = userDetails.toObject()
        console.log("2")
        var SubsectionLength = 0
        console.log("3")
        for(var i=0;i<userDetails.courses.length;i++){
            console.log("3")
            let totalDurationInSeconds = 0
            console.log("4")
            SubsectionLength = 0
            console.log("5")
            for(var j=0;j<userDetails.courses[i].courseContent.length;j++){
                console.log("6")
                totalDurationInSeconds += userDetails.courses[i].courseContent[j]
                .subSection.reduce((acc,curr)=>acc+parseInt(curr.timeDuration),0)
                console.log("7",totalDurationInSeconds)
                const duration =  formatSeconds(totalDurationInSeconds)
                console.log("dis",duration)
                const totalDurationI = duration[0]+" h "+ duration[1]+" m "+ duration[2]+" s"
                console.log("td",totalDurationI)
                userDetails.courses[i].totalDuration = totalDurationI
                console.log("8",userDetails.courses[i].totalDuration)
                SubsectionLength += userDetails.courses[i].courseContent[j].subSection.length
                console.log("9")
            }
            console.log("10")
            let courseProgressCount = await CourseProgress.findOne({
                courseID:userDetails.courses[i]._id,
                userId:userId,
            })
            console.log("11")
            courseProgressCount = courseProgressCount?.completedVideos.length
            console.log("12")
            if(SubsectionLength === 0){
                console.log("13")
                userDetails.courses[i].progressPercentage = 100
                console.log("14")
            }else{
                console.log("15")
                const multiplier = Math.pow(10,2)
                console.log("16")
                userDetails.courses[i].progressPercentage = Math.round(
                    (courseProgressCount / SubsectionLength) * 100 * multiplier
                ) / multiplier
                console.log("17")
            }
            console.log("18")
        }
        console.log("19")
        
        if(!userDetails){
            console.log("20")
            return res.status(400).json({
                success:false,
                message:`Could not find user with id: ${userDetails}`,
            })
        }
        
        console.log("21")

        return res.status(200).json({
            success:true,
            data:userDetails.courses
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}