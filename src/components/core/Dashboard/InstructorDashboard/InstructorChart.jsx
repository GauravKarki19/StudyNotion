import React from "react"
import { Chart as ChartJS, registerables } from "chart.js"
import { Bar, Chart } from "react-chartjs-2"

ChartJS.register(...registerables)

export default function InstructorChart({ courses }) {
  // Extracting data from the courses array
  let coursePrice=0;
  const courseNames = courses.map((course) => course.courseName)
  const totalStudents = courses.map((course) => course.studentsEnrolled.length)
  const totalAmounts = courses.map((course) => {
    coursePrice+=course.price
    return coursePrice
})

  // Creating the students enrolled chart data
  const studentsEnrolledData = {
    labels: courseNames,
    datasets: [
      {
        label: "Total Students Enrolled",
        data: totalStudents,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  }                 

  // Creating the amount generated chart data
  const amountGeneratedData = {
    labels: courseNames,
    datasets: [
      {
        label: "Total Amount Generated",
        data: totalAmounts,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  }

  // Chart options
  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div>
      {/* <div className="flex flex-col min-h- w-full space-x-4"> */}
      <div className="flex-1 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-4">
        <Bar data={studentsEnrolledData} options={options} />
      </div>
      <div className="flex-1 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-4">
        <Bar data={amountGeneratedData} options={options} />
      </div>
      {/* </div> */}
    </div>
  )
}
