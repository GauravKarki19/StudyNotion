// import the required module
const express=require("express")
const router=express.Router()

// Import the controllers

// Course controllers import
const{
    createCourse,
    getAllCourses,
    getCourseDetails,
    getInstructorCourses,
    editCourse,
    getFullCourseDetails,
    deleteCourse,
}=require("../controllers/course")

// Categories controllers import
const{
    showAllCategories,
    createCategory,
    categoryPageDetails,
}=require("../controllers/categories")

// Section controllers import
const{
    createSection,
    updateSection,
    deleteSection,
}=require("../controllers/Section")

// Sub Sections controllers import
const{
    createSubSection,
    updateSubSection,
    deleteSubSection,
}=require("../controllers/Subsection")

// Rating controllers import
const{
    createRating,
    getAverageRating,
    getAllRating,
}=require("../controllers/RatingAndReview")

// Importing middlewares
const{auth,isInstructor,isStudent,isAdmin}=require("../middlewares/auth")
const { updateCourseProgress } = require("../controllers/CourseProgress")

// Course routes

// Course can only be created by Instructors
router.post("/createCourse",auth,isInstructor,createCourse)

// Add a section to a course
router.post("/addSection",auth,isInstructor,createSection)

// update a section
router.put("/updateSection",auth,isInstructor,updateSection)

// delete a section
router.delete("/deleteSection",auth,isInstructor,deleteSection)

// update subsection
router.put("/updateSubSection",auth,isInstructor,updateSubSection)

// delete subsection
router.delete("/deleteSubSection",auth,isInstructor,deleteSubSection)

// add a subsection to a section
router.post("/addSubSection",auth,isInstructor,createSubSection)

router.get("/getInstructorCourses",auth,isInstructor,getInstructorCourses)

// get all registered courses
router.get("/getAllCourses",getAllCourses)

// get details for a specific courses
router.post("/getCourseDetails",getCourseDetails)   

router.put("/editCourse",auth,isInstructor,editCourse)

router.post("/getFullCourseDetails",auth,getFullCourseDetails)

router.delete("/deleteCourse",deleteCourse)

// Category can only be created by Admin
router.post("/createCategory",auth,isAdmin,createCategory)
router.post("/showAllCategories",showAllCategories)
router.post("/getCategoryPageDetails",categoryPageDetails)



// Rating and Review
router.post("/createRating",auth,isStudent,createRating)
router.get("/getAverageRating",getAverageRating)
router.get("/getReviews",getAllRating)

router.post("/updateCourseProgress",auth,isStudent,updateCourseProgress)

module.exports=router