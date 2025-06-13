"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Star, Users, Clock, CheckCircle, Search, Filter, SortAsc, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Course {
  id: string
  title: string
  description: string
  primary_language: string
  course_type: string
  stats: {
    totalModules: number
    totalVideos: number
    completedVideos: number
    progressPercentage: number
    averageRating: number
    totalRatings: number
    enrolledStudents: number
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedLanguage, setSelectedLanguage] = useState("all")
  const [sortBy, setSortBy] = useState("title")
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])

  useEffect(() => {
    fetchCourses()
  }, [user?.id])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const url = user?.id ? `/api/courses?userId=${user.id}` : "/api/courses"
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch courses")
      }

      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    const filtered = courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === "all" || course.course_type === selectedType
      const matchesLanguage = selectedLanguage === "all" || course.primary_language === selectedLanguage

      return matchesSearch && matchesType && matchesLanguage
    })

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "progress":
          return b.stats.progressPercentage - a.stats.progressPercentage
        case "modules":
          return b.stats.totalModules - a.stats.totalModules
        case "videos":
          return b.stats.totalVideos - a.stats.totalVideos
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedType("all")
    setSelectedLanguage("all")
    setSortBy("title")
  }

  const getUniqueValues = (key: keyof Course) => {
    const values = courses.map((course) => course[key] as string)
    return [...new Set(values)].filter(Boolean)
  }

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchQuery, selectedType, selectedLanguage, sortBy])

  if (loading) {
    return <CoursesLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Learn & Grow</h1>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Master new skills with our comprehensive courses designed for learners at every level
            </p>
            {!user && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm mb-3">Sign in to track your progress and save your learning journey</p>
                <Link href="/login">
                  <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                    Sign In to Track Progress
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Course Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueValues("course_type").map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {getUniqueValues("primary_language").map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="modules">Modules</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || selectedType !== "all" || selectedLanguage !== "all" || sortBy !== "title") && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedType !== "all" || selectedLanguage !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {selectedType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType("all")} />
                </Badge>
              )}
              {selectedLanguage !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Language: {selectedLanguage}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLanguage("all")} />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Available Courses</h2>
          <div className="text-sm text-gray-600">
            {filteredCourses.length} of {courses.length} course{courses.length !== 1 ? "s" : ""}
            {filteredCourses.length !== courses.length && " (filtered)"}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} isLoggedIn={!!user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {courses.length === 0 ? "No Courses Available" : "No Courses Match Your Filters"}
            </h3>
            <p className="text-gray-500 mb-4">
              {courses.length === 0
                ? "Check back later for new courses!"
                : "Try adjusting your search terms or filters to find more courses."}
            </p>
            {courses.length > 0 && (
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CourseCard({ course, isLoggedIn }: { course: Course; isLoggedIn: boolean }) {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="secondary" className="bg-white/20 text-white border-none">
            {course.course_type}
          </Badge>
          {course.stats.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current text-yellow-300" />
              <span className="text-sm font-medium">{course.stats.averageRating}</span>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
        <p className="opacity-90 text-sm leading-relaxed">{course.description}</p>
      </div>

      <CardContent className="p-6">
        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{course.stats.totalModules}</div>
            <div className="text-xs text-gray-500">Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{course.stats.totalVideos}</div>
            <div className="text-xs text-gray-500">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{course.stats.enrolledStudents}</div>
            <div className="text-xs text-gray-500">Students</div>
          </div>
        </div>

        {/* Progress Section - Only show if user is logged in */}
        {isLoggedIn && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{course.stats.progressPercentage}%</span>
            </div>
            <Progress value={course.stats.progressPercentage} className="h-2" />
            <div className="text-xs text-gray-500 mt-1">
              {course.stats.completedVideos} of {course.stats.totalVideos} videos completed
            </div>
            {course.stats.progressPercentage === 100 && (
              <div className="flex items-center gap-1 mt-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Course Completed!</span>
              </div>
            )}
          </div>
        )}

        {/* Course Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className="text-xs">
            {course.primary_language}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {course.course_type}
          </Badge>
        </div>

        {/* Action Button */}
        <Link href={`/courses/${course.id}`} className="block">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <BookOpen className="w-4 h-4 mr-2" />
            {isLoggedIn && course.stats.progressPercentage > 0 ? "Continue Learning" : "View Course"}
          </Button>
        </Link>

        {/* Course Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{course.stats.enrolledStudents} enrolled</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Updated recently</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CoursesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16 animate-pulse">
          <div className="text-center">
            <div className="h-12 bg-white/20 rounded mb-6 w-64 mx-auto"></div>
            <div className="h-6 bg-white/20 rounded mb-8 w-96 mx-auto"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="h-8 bg-gray-200 rounded mb-8 w-64 animate-pulse"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32"></div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-8 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
