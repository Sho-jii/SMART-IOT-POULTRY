"use client"

import { useState } from "react"
import NavigationMenu from "@/components/common/navigation-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Github, Mail, Linkedin, Code, Wrench, FileText, Brain, Cpu, Server, Layout } from "lucide-react"

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("system")

  const teamMembers = [
    {
      name: "Jarib Sioco",
      role: "Lead Software & Web Engineer",
      icon: Code,
      desc: "Architected and developed the responsive Next.js web application, real-time Firebase telemetry synchronizers, and camera streaming integration.",
    },
    {
      name: "Ralf Carlo Legaspi",
      role: "Hardware & IoT Systems Engineer",
      icon: Wrench,
      desc: "Engineered microcontroller circuits, sensor firmware on ESP32 / ESP32-CAM, and relay motor driver automation mechanisms.",
    },
    {
      name: "Grace Melody Manalo",
      role: "System Analyst & Research Documentation",
      icon: FileText,
      desc: "Formulated poultry health parameters, broiler growth stage algorithms, and comprehensive system testing methodologies.",
    },
    {
      name: "Monica Bacay",
      role: "Product Analyst & Quality Assurance",
      icon: Brain,
      desc: "Conducted usability testing, operational safety analysis, and documented system functional specifications.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-200">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
                About Smart IoT Poultry System
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Technical architecture, hardware specifications & engineering team
              </p>
            </div>
          </header>

          <Tabs defaultValue="system" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-6 bg-surface-muted border border-border p-1 rounded-xl">
              <TabsTrigger
                value="system"
                className="text-xs font-semibold rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                System Architecture
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="text-xs font-semibold rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                Engineering Team
              </TabsTrigger>
            </TabsList>

            {/* System Overview Tab */}
            <TabsContent value="system" className="space-y-6">
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Smart IoT-Based Poultry Farming Solution (SIPFS)
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    Academic Prototype
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Developed as a student prototype for the 2nd Year collegiate course <strong>Integrative Programming 1</strong>,
                  SIPFS is an integrated agro-industrial Internet of Things solution designed to
                  explore broiler farm automation through environmental climate control,
                  precision stage-based feed dispensing, hydration level regulation, and live video surveillance.
                </p>

                <h3 className="font-heading text-sm font-semibold mb-3 text-foreground">
                  Core Subsystems & Capabilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      title: "Environmental Climate Monitoring",
                      desc: "Continuous sampling of ambient house temperature, relative humidity, and environmental air conditions.",
                    },
                    {
                      title: "Age-Calibrated Feeder Dispenser",
                      desc: "Automated scheduled dispensing calibrated to bird age stage (Starter, Grower, Finisher) with ultrasonic hopper sensing.",
                    },
                    {
                      title: "Hydration & Reservoir Management",
                      desc: "Dual level capacitive tracking across storage reservoirs and broiler drinker lines with automated solenoid pumping.",
                    },
                    {
                      title: "Real-time Telemetry & Tele-Operation",
                      desc: "Sub-second Firebase Realtime Database sync and direct manual actuator overrides from any authenticated browser.",
                    },
                  ].map((feature, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface-muted border border-border">
                      <h4 className="font-heading text-xs font-semibold text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-heading text-sm font-semibold mb-3 text-foreground">
                  Technology Stack
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-muted border border-border">
                    <div className="flex items-center gap-2 mb-2 text-accent">
                      <Layout size={16} />
                      <h4 className="font-heading text-xs font-semibold text-foreground">Frontend</h4>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Next.js 15 (App Router)</li>
                      <li>• React 19 & TypeScript</li>
                      <li>• Tailwind CSS Design System</li>
                      <li>• Chart.js Visualizations</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-muted border border-border">
                    <div className="flex items-center gap-2 mb-2 text-accent">
                      <Server size={16} />
                      <h4 className="font-heading text-xs font-semibold text-foreground">Backend & Cloud</h4>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Firebase Realtime Database</li>
                      <li>• Realtime WebSocket Listeners</li>
                      <li>• Camera Reverse Proxy Handlers</li>
                      <li>• Local Session Gating</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-muted border border-border">
                    <div className="flex items-center gap-2 mb-2 text-accent">
                      <Cpu size={16} />
                      <h4 className="font-heading text-xs font-semibold text-foreground">Microcontroller & Edge</h4>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• ESP32 Dual-Core SoC</li>
                      <li>• ESP32-CAM Video Streamer</li>
                      <li>• DHT11 & Ultrasonic Sensors</li>
                      <li>• Multi-Channel Relay Drivers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMembers.map((member, i) => {
                  const Icon = member.icon
                  return (
                    <div
                      key={i}
                      className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
                            <Icon size={18} />
                          </div>
                          <div>
                            <h3 className="font-heading text-sm font-semibold text-foreground">
                              {member.name}
                            </h3>
                            <p className="text-xs text-accent font-medium">{member.role}</p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                          {member.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-border">
                        <a
                          href="#"
                          className="p-2 rounded-lg bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors text-xs"
                          title="Contact"
                        >
                          <Mail size={14} />
                        </a>
                        <a
                          href="#"
                          className="p-2 rounded-lg bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors text-xs"
                          title="GitHub"
                        >
                          <Github size={14} />
                        </a>
                        <a
                          href="#"
                          className="p-2 rounded-lg bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors text-xs"
                          title="LinkedIn"
                        >
                          <Linkedin size={14} />
                        </a>
                      </div>
                    </div>
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
