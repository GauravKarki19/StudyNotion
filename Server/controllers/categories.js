const Category=require("../models/Categories");

// create category ka handler function

exports.createCategory=async(req,res)=>{
    try{
        // fetch data
        const {name,description}=req.body;

        // validation
        if(!name||!description){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }

        // create entry in DB
        const categoryDetails=await Category.create({
            name:name,
            description:description,
        })
        console.log(categoryDetails);

        // return response
        return res.status(200).json({
            success:true,
            message:"Category created successfully",
            data:categoryDetails,
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


// getAllcategories handler function
exports.showAllCategories=async(req,res)=>{
    try{
        const allCategories=await Category.find({},{name:true,description:true}).populate("courses");
        
        // return response
        return res.status(200).json({
            success:true,
            data:allCategories,
            message:"All categories returned successfully",
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


exports.categoryPageDetails=async(req,res)=>{
    try{
        // get categoryId
        const {categoryId}=req.body;
        console.log("request  category id",categoryId)
        // get courses for the specified category
        const selectedCategory=await Category.findById({_id:categoryId})
        .populate({
            path:"courses",
            match:{status:"Published"},
            // populate:"ratingAndReviews",
        })
        .exec();
        console.log(selectedCategory);

        // Handle the case when the category is not found
        if(!selectedCategory){
            console.log("Category not found.");
            return res.status(404).json({
                success:false,
                message:"Category not found",
            })
        }

        // handle the case when there are no courses
        if(selectedCategory.courses.length===0){
            console.log("No courses found for the selected category");
            return res.status(404).json({
                success:false,
                message:"No courses found for the selected category",
            })
        }

        
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        console.log("1")
        // get courses for other categories
        const categoriesExceptSelected=await Category.find({
            _id:{$ne:categoryId},
        })
        console.log("categories except selected",categoriesExceptSelected)
        let differentCategory=await Category.findOne(
            categoriesExceptSelected[getRandomInt(0,categoriesExceptSelected.length)]
            ._id
            )
            .populate({
                path:"courses",
                match:{status:"Published"},
            })
            .exec();
        console.log("different category",differentCategory)
        // get top-selling courses across all categories
        
        // let differentCourses=[];
        // for(const category of categoriesExceptSelected){
        //     differentCourses.push(...category.courses);
        //     const mostSellingCourses=allCourses
        //     .sort((a,b)=>b.sold-a.sold)
        //     .slice(0,10);
        // }

        const allCategories=await Category.find()
        .populate({
            path:"courses",
            match:{status:"Published"},
        })
        .exec()
        console.log("all categories",allCategories)
        const allCourses=allCategories.flatMap((category)=>category.courses)
        const mostSellingCourses=allCourses
        .sort((a,b)=>b.sold-a.sold)
        .slice(0,10)
        console.log("all courses",allCourses)

        // return response
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            }
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Internal server error",
            error:error.message,
        })
    }
}