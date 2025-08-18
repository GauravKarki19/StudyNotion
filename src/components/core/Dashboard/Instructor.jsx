import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { getInstructorData } from "../../../services/operations/profileAPI"
import InstructorChart from "./InstructorDashboard/InstructorChart"

export default function Instructor() {
  const { token } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [instructorData, setInstructorData] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const instructorApiData = await getInstructorData(token)
      console.log(instructorApiData)
      if (instructorApiData.length) setInstructorData(instructorApiData)
      setLoading(false)
    console.log("first")
    })()
  }, [token])

  return (
    <div>
      <h1 className="text-3xl text-richblack-50">Instructor Dashboard</h1>
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="flex flex-col text-white">
          {instructorData?.length ? (
            <InstructorChart courses={instructorData} />
          ) : (
            "No courses"
          )}
        </div>
      )}
    </div>
  )
}
