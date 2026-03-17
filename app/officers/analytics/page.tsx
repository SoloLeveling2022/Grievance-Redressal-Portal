"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Activity,
  Heart,
  Target,
  BarChart3,
  PieChart,
  IndianRupee,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
} from "recharts"
import { OfficersLayout } from "@/components/doctor/officer-layout"

// Define interfaces for mock analytics data
interface ResolutionData {
  date: string
  count: number
  budget: number
  complainants: number
}

interface ComplaintCategory {
  category: string
  count: number
  percentage: number
}

interface ComplainantDemographic {
  ageGroup: string
  male: number
  female: number
  total: number
}

interface PerformanceTrend {
  month: string
  completionRate: number
  successRate: number
  satisfaction: number
}

interface BudgetBreakdown {
  category: string
  amount: number
  percentage: number
}

interface MockAnalytics {
  overview: {
    totalComplaints: number
    totalResolutions: number
    avgResolutionTime: number
    complainantSatisfaction: number
    budgetUtilized: number
    growthRate: number
  }
  trends: {
    resolutionsThisMonth: ResolutionData[]
    complaintsByCategory: ComplaintCategory[]
    complainantDemographics: ComplainantDemographic[]
    performanceTrends: PerformanceTrend[]
    budgetBreakdown: BudgetBreakdown[]
  }
  performance: {
    resolutionCompletionRate: number
    averageResponseTime: number
    complainantRetentionRate: number
    resolutionSuccessRate: number
  }
}

export default function GrievanceAnalytics() {
  const [timeRange, setTimeRange] = useState<"thisWeek" | "thisMonth" | "lastMonth" | "thisYear">("thisMonth")
  const [metricType, setMetricType] = useState<string>("all")

  // Mock analytics data
  const mockAnalytics: MockAnalytics = {
    overview: {
      totalComplaints: 156,
      totalResolutions: 342,
      avgResolutionTime: 24,
      complainantSatisfaction: 4.8,
      budgetUtilized: 45600,
      growthRate: 12.5,
    },
    trends: {
      resolutionsThisMonth: [
        { date: "Week 1", count: 85, budget: 12800, complainants: 38 },
        { date: "Week 2", count: 92, budget: 14200, complainants: 42 },
        { date: "Week 3", count: 78, budget: 11600, complainants: 35 },
        { date: "Week 4", count: 87, budget: 13400, complainants: 41 },
      ],
      complaintsByCategory: [
        { category: "Service", count: 45, percentage: 28.8 },
        { category: "Product", count: 38, percentage: 24.4 },
        { category: "Billing", count: 32, percentage: 20.5 },
        { category: "Policy", count: 25, percentage: 16.0 },
        { category: "Other", count: 16, percentage: 10.3 },
      ],
      complainantDemographics: [
        { ageGroup: "0-18", male: 12, female: 15, total: 27 },
        { ageGroup: "19-35", male: 22, female: 28, total: 50 },
        { ageGroup: "36-50", male: 18, female: 24, total: 42 },
        { ageGroup: "51-65", male: 15, female: 12, total: 27 },
        { ageGroup: "65+", male: 5, female: 5, total: 10 },
      ],
      performanceTrends: [
        { month: "Jan", completionRate: 92, successRate: 89, satisfaction: 4.6 },
        { month: "Feb", completionRate: 94, successRate: 91, satisfaction: 4.7 },
        { month: "Mar", completionRate: 93, successRate: 90, satisfaction: 4.8 },
        { month: "Apr", completionRate: 95, successRate: 92, satisfaction: 4.8 },
        { month: "May", completionRate: 94, successRate: 91, satisfaction: 4.9 },
      ],
      budgetBreakdown: [
        { category: "Resolutions", amount: 28500, percentage: 62.5 },
        { category: "Investigations", amount: 12300, percentage: 27.0 },
        { category: "Follow-ups", amount: 3200, percentage: 7.0 },
        { category: "Escalations", amount: 1600, percentage: 3.5 },
      ],
    },
    performance: {
      resolutionCompletionRate: 94.2,
      averageResponseTime: 8.5,
      complainantRetentionRate: 87.3,
      resolutionSuccessRate: 91.7,
    },
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const getGrowthColor = (value: number): string => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  const getPerformanceColor = (value: number, threshold: number = 80): string => {
    if (value >= threshold) return "text-green-600"
    if (value >= threshold * 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{ color: string; dataKey: string; value: number }>
    label?: string
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <OfficersLayout>
      <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grievance Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your grievance handling performance and outcomes
            </p>
          </div>
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complainants</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.totalComplaints}</div>
              <p className={`text-xs ${getGrowthColor(mockAnalytics.overview.growthRate)}`}>
                +{mockAnalytics.overview.growthRate}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolutions</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.totalResolutions}</div>
              <p className="text-xs text-green-600">+8.2% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.avgResolutionTime}h</div>
              <p className="text-xs text-red-600">+2h from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.complainantSatisfaction}/5</div>
              <p className="text-xs text-green-600">+0.2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilized</CardTitle>
              <IndianRupee className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{mockAnalytics.overview.budgetUtilized.toLocaleString()}</div>
              <p className="text-xs text-green-600">+15.3% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.performance.resolutionSuccessRate}%</div>
              <p className="text-xs text-green-600">+3.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="complainants">Complainants</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resolution Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Resolution Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockAnalytics.trends.resolutionsThisMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Complaints by Category Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Complaints by Category</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={mockAnalytics.trends.complaintsByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {mockAnalytics.trends.complaintsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="complainants" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Complainants</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-green-600">+18% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Returning Complainants</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">133</div>
                  <p className="text-xs text-green-600">+5% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.performance.complainantRetentionRate}%</div>
                  <p className="text-xs text-green-600">+2.1% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                  <Activity className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-green-600">+33% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Complainant Demographics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Complainant Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mockAnalytics.trends.complainantDemographics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="male" fill="#3b82f6" name="Male" />
                    <Bar dataKey="female" fill="#ec4899" name="Female" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.performance.resolutionCompletionRate}%</div>
                  <p className={`text-xs ${getPerformanceColor(mockAnalytics.performance.resolutionCompletionRate)}`}>
                    Excellent performance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.performance.averageResponseTime}h</div>
                  <p className="text-xs text-green-600">Below target (10h)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.performance.resolutionSuccessRate}%</div>
                  <p className={`text-xs ${getPerformanceColor(mockAnalytics.performance.resolutionSuccessRate, 90)}`}>
                    Above average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unresolved Rate</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5.8%</div>
                  <p className="text-xs text-green-600">Below industry average</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockAnalytics.trends.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Completion Rate (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Success Rate (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Satisfaction"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                  <IndianRupee className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{mockAnalytics.overview.budgetUtilized.toLocaleString()}</div>
                  <p className="text-xs text-green-600">+15.3% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. per Complainant</CardTitle>
                  <IndianRupee className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{Math.round(mockAnalytics.overview.budgetUtilized / mockAnalytics.overview.totalComplaints)}
                  </div>
                  <p className="text-xs text-green-600">+8.7% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Efficiency</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">96.2%</div>
                  <p className="text-xs text-green-600">Excellent efficiency</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={mockAnalytics.trends.budgetBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {mockAnalytics.trends.budgetBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalytics.trends.resolutionsThisMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      <Bar dataKey="budget" fill="#10b981" name="Weekly Budget" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OfficersLayout>
  )
}