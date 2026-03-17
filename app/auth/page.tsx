"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, UserCheck, Shield, Activity, Brain, Heart, Stethoscope, Plus } from "lucide-react"
import { Logo } from "@/components/common/logo"
import { LanguageToggle } from "@/components/language/language-toggle"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language/language-provider"

export default function AuthPage() {
  const [userType, setUserType] = useState("citizen")
  const [authMode, setAuthMode] = useState("login")
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    setIsLoaded(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleAuth = () => {
    if (userType === "citizen") {
      router.push("/citizen/dashboard");
    } else {
      router.push("/pending/admin");
    }
  }

  const userTypes = [
    { 
      key: "citizen", 
      icon: User, 
      label: t("citizen"),
      description: t("citizenRoleDesc"),
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      shadowColor: "shadow-blue-500/25"
    },
    { 
      key: "officers", 
      icon: UserCheck, 
      label: t("officers"),
      description: t("officersRoleDesc"),
      gradient: "from-emerald-500 via-green-600 to-teal-600",
      shadowColor: "shadow-emerald-500/25"
    },
    // { 
    //   key: "police", 
    //   icon: Shield, 
    //   label: t("police"),
    //   description: t("policeRoleDesc"),
    //   gradient: "from-red-500 via-rose-600 to-pink-600",
    //   shadowColor: "shadow-red-500/25"
    // },
  ]

  const backgroundIcons = [
    { Icon: Heart, delay: 0, duration: 8 },
    { Icon: Brain, delay: 1, duration: 10 },
    { Icon: Activity, delay: 2, duration: 12 },
    { Icon: Stethoscope, delay: 3, duration: 9 },
    { Icon: Plus, delay: 4, duration: 11 }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 z-20 flex items-center px-3 py-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-gray-700 shadow hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="font-medium text-gray-700 dark:text-gray-200">Back</span>
      </button>
      
      {/* Dynamic Background with Mouse Interaction */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Medical Icons */}
        {backgroundIcons.map(({ Icon, delay, duration }, index) => (
          <div
            key={index}
            className="absolute opacity-5 dark:opacity-10"
            style={{
              left: `${10 + (index * 20)}%`,
              top: `${15 + (index * 15)}%`,
              animation: `floatSmooth ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`
            }}
          >
            <Icon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        ))}
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" className="text-blue-500" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 min-h-screen flex flex-col justify-center py-12 px-4 transition-all duration-1000 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-between items-center mx-20 mb-8">
              <Logo size="lg" isLanding={false} className="text-gray-900 dark:text-white" />
              <LanguageToggle />
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full">
          {/* User Type Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
              {t("selectYourRole")}
            </h2>
            
            <div className="flex justify-center items-center gap-8 max-w-2xl mx-auto mb-10">
              {userTypes.map((type, index) => {
                const Icon = type.icon
                const isSelected = userType === type.key
                
                return (
                  <div
                    key={type.key}
                    className="relative cursor-pointer group"
                    onClick={() => setUserType(type.key)}
                    style={{
                      animation: `morphIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                      animationDelay: `${index * 0.15}s`,
                      opacity: 0,
                      transform: 'scale(0.3) rotate(180deg)'
                    }}
                  >
                    {/* Magnetic Field Effect */}
                    <div className={`absolute -inset-8 rounded-full transition-all duration-700 ease-out ${
                      isSelected ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-xl scale-150' : ''
                    }`} />
                    
                    {/* Orbiting Ring */}
                    <div className={`absolute -inset-4 border-2 border-transparent rounded-full transition-all duration-500 ${
                      isSelected 
                        ? 'border-blue-400/40 animate-spin' 
                        : 'group-hover:border-gray-300/30 group-hover:animate-pulse'
                    }`} />
                    
                    {/* Main Card */}
                    <div className={`relative w-24 h-24 rounded-2xl shadow-lg transform transition-all duration-500 ease-out ${
                      isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 scale-110 shadow-2xl shadow-blue-500/40 rotate-0' 
                        : 'bg-white dark:bg-slate-800 hover:scale-105 hover:shadow-xl group-hover:-rotate-6'
                    } ${
                      !isSelected ? 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-600' : ''
                    }`}>
                      
                      {/* Icon with Morphing Animation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`transform transition-all duration-500 ${
                          isSelected 
                            ? 'scale-125 rotate-360' 
                            : 'group-hover:scale-110 group-hover:rotate-12'
                        }`}>
                          <Icon className={`w-8 h-8 transition-colors duration-300 ${
                            isSelected 
                              ? 'text-white' 
                              : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`} />
                        </div>
                      </div>
                      
                      {/* Ripple Effect */}
                      {isSelected && (
                        <div className="absolute inset-0 rounded-2xl">
                          <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping" />
                          <div className="absolute inset-2 bg-white/10 rounded-xl animate-pulse" />
                        </div>
                      )}
                      
                      {/* Particles */}
                      {isSelected && (
                        <>
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 bg-white/60 rounded-full"
                              style={{
                                top: '50%',
                                left: '50%',
                                animation: `particleFloat 2s linear infinite`,
                                animationDelay: `${i * 0.3}s`,
                                transform: `rotate(${i * 60}deg) translateX(40px)`
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                    
                    {/* Label with Slide Animation */}
                    <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
                      isSelected 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-2 opacity-70 group-hover:translate-y-0 group-hover:opacity-100'
                    }`}>
                      <div className={`text-sm font-medium text-center whitespace-nowrap px-3 py-1 rounded-full transition-all duration-300 ${
                        isSelected 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {type.label}
                      </div>
                    </div>
                    
                    {/* Holographic Overlay */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 ${
                      isSelected ? 'opacity-100' : 'group-hover:opacity-50'
                    }`} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Authentication Form */}
          <div className="max-w-md mx-auto">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {authMode === 'login' ? t('welcomeBack') : t('createAccount')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {authMode === 'login' 
                    ? t('signInToAccessDashboard')
                    : t('joinFutureHealthcare')
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-slate-700 h-12">
                    <TabsTrigger 
                      value="login" 
                      className="text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      {t('signIn')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      {t('signUp')}
                    </TabsTrigger>
                  </TabsList>

                  <div className="relative">
                    <TabsContent value="login" className="space-y-5 m-0">
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('email')}
                          </Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="you@example.com"
                            className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/10 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('password')}
                          </Label>
                          <Input 
                            id="password" 
                            type="password" 
                            placeholder="Enter your password"
                            className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/10 transition-colors"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleAuth}
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                          {t('signInAs')} {t(userType)}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-5 m-0">
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('fullName')}
                          </Label>
                          <Input 
                            id="name" 
                            type="text" 
                            placeholder="John Doe"
                            className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/10 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('email')}
                          </Label>
                          <Input 
                            id="signup-email" 
                            type="email" 
                            placeholder="you@example.com"
                            className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/10 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('password')}
                          </Label>
                          <Input 
                            id="signup-password" 
                            type="password" 
                            placeholder="Create a secure password"
                            className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/10 transition-colors"
                          />
                        </div>
                        
                        {userType === "officers" && (
                          <div className="space-y-2">
                            <Label htmlFor="license" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('medicalLicense')}
                            </Label>
                            <Input 
                              id="license" 
                              type="text" 
                              placeholder="Enter your license number"
                              className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/10 transition-colors"
                            />
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleAuth}
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                          {t('createAccountFor').replace('{userType}', t(userType))}
                        </Button>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Keyframes */}
      <style>{`
        @keyframes floatSmooth {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-10px) translateX(5px) rotate(90deg); 
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-5px) translateX(-5px) rotate(180deg); 
            opacity: 0.4;
          }
          75% { 
            transform: translateY(-15px) translateX(3px) rotate(270deg); 
            opacity: 0.7;
          }
        }
        
        @keyframes morphIn {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(180deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes particleFloat {
          0% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateX(20px) scale(0);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation, 0deg)) translateX(40px) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateX(60px) scale(0);
          }
        }
        
        .rotate-360 {
          transform: rotate(360deg);
        }
      `}</style>
    </div>
  )
}
