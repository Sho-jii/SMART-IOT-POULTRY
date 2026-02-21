"use client"

import { useState } from "react"
import NavigationMenu from "@/components/navigation-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Mail, Linkedin, Globe, Code, Wrench, FileText, Brain } from "lucide-react"

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("system")

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-300">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
          <header className="mb-8 animate-fade-in-up">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">About Our System</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Learn about the Smart IoT-Based Poultry Farming Solution and the team behind it
            </p>
          </header>

          <Tabs defaultValue="system" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="system">About the System</TabsTrigger>
              <TabsTrigger value="team">Our Team</TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-6">
              <div className="sensor-card p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                <h2 className="font-heading text-xl font-bold mb-4 text-foreground">Smart IoT-Based Poultry Farming Solution</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  The Smart IoT-Based Poultry Farming Solution (SIPFS) aims to revolutionize traditional poultry farming by
                  introducing automation, real-time monitoring, and data-driven management through Internet of Things (IoT)
                  technology. This system integrates environmental sensors, actuators, and a web interface to monitor and
                  control temperature, humidity, water, and feed levels in poultry houses.
                </p>

                <h3 className="font-heading text-lg font-semibold mb-3 text-foreground">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { title: "Environmental Monitoring", desc: "Real-time tracking of temperature, humidity, and other environmental factors critical for poultry health." },
                    { title: "Intelligent Feeding System", desc: "Automated feeding based on schedules and poultry age, with manual override capabilities." },
                    { title: "Water Management", desc: "Monitoring of water levels, automated refilling, and hydration tracking for optimal poultry health." },
                    { title: "Remote Monitoring", desc: "Access to farm conditions from anywhere through a responsive web dashboard with real-time updates." },
                  ].map((feature, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <h4 className="font-heading text-sm font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-heading text-lg font-semibold mb-3 text-foreground">Technology Stack</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-pond/5 border border-pond/10">
                    <h4 className="font-heading text-sm font-semibold text-pond dark:text-pond-light mb-2">Frontend</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Next.js (React Framework)</li>
                      <li>Tailwind CSS</li>
                      <li>TypeScript</li>
                      <li>Recharts for data visualization</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-sage/5 border border-sage/10">
                    <h4 className="font-heading text-sm font-semibold text-sage dark:text-sage-light mb-2">Backend</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Firebase Realtime Database</li>
                      <li>Firebase Authentication</li>
                      <li>Server-side rendering</li>
                      <li>Real-time data synchronization</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-copper/5 border border-copper/10">
                    <h4 className="font-heading text-sm font-semibold text-copper dark:text-copper-light mb-2">Hardware</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>ESP32 Microcontroller</li>
                      <li>ESP32-CAM Module</li>
                      <li>DHT11 temperature/humidity sensor</li>
                      <li>Ultrasonic sensor for food level detection</li>
                      <li>Water Level Sensors</li>
                      <li>Servo motor and relay for automation</li>
                      <li>Cooling Fan, Heat Lamp and Water Pump</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "Jarib Sioco", role: "Web Developer", icon: Code, iconColor: "text-pond", desc: "Developed the web interface and dashboard for the Smart Poultry Farming Solution, implementing the frontend components and Firebase integration." },
                  { name: "Ralf Carlo Legaspi", role: "Hardware Engineer", icon: Wrench, iconColor: "text-sage", desc: "Designed and built the hardware components of the system, including sensor integration, microcontroller programming, and physical automation mechanisms." },
                  { name: "Grace Melody Manalo", role: "Documentation & System Analyst", icon: FileText, iconColor: "text-harvest", desc: "Led the documentation efforts and provided valuable recommendations for system improvements based on research and user feedback analysis." },
                  { name: "Monica Bacay", role: "Documentation & System Analyst", icon: Brain, iconColor: "text-copper", desc: "Contributed to the documentation and provided critical insights for system design and implementation, focusing on usability and practical applications." },
                ].map((member, i) => {
                  const Icon = member.icon
                  return (
                    <Card key={i} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: "forwards" }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 font-heading">
                          <Icon className={member.iconColor} size={18} />
                          {member.name}
                        </CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl opacity-50">👤</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{member.desc}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-start gap-2 pt-0">
                        <a href="#" className="p-2 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Mail size={14} />
                        </a>
                        <a href="#" className="p-2 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Github size={14} />
                        </a>
                        <a href="#" className="p-2 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Linkedin size={14} />
                        </a>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
