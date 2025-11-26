"use client"

import { colors } from "@/utils/color"
import CountUp from "@/components/ui/count-up"
import GlowingCard from "@/components/ui/glowing-card"
import {
  BotMessageSquare,
  Hourglass,
  MessageSquare,
  Send,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import UserPromptChart from "@/components/custom/admin/chart/user-prompt-chart"
import ReEngagementChart from "@/components/custom/admin/chart/re-engagement-chart"
import TopIntentChart from "@/components/custom/admin/chart/top-intent-chart"

export default function Dashboard() {
  const { resolvedTheme } = useTheme()

  const [theme, setTheme] = useState('')

  useEffect(() => {
    setTheme(resolvedTheme as string);
  }, [resolvedTheme])

  return (
    <>
      <div className="flex flex-wrap items-stretch justify-center md:gap-10 gap-5">
        <GlowingCard
          color={theme && theme === 'dark' ? 'gold' : 'red'}
        >
          <div className="flex justify-between items-center gap-3">
            <span>Total conversations</span>

            <div className={`p-2 ${colors.blue.active} rounded-lg`}>
              <MessageSquare size={20} />
            </div>
          </div>

          <p className="text-2xl font-bold">
            <CountUp
              from={0}
              to={1234567}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
            />
          </p>

          <div className="flex justify-between items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className={`text-sm ${colors.green.text}`} />
              <span className={`text-sm ${colors.green.text}`}>
                Up by 50% for last month
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              +20
            </span>
          </div>
        </GlowingCard>

        <GlowingCard
          color={theme && theme === 'dark' ? 'gold' : 'red'}
        >
          <div className="flex justify-between items-center gap-3">
            <span>Active User</span>

            <div className={`p-2 ${colors.green.active} rounded-lg`}>
              <Users size={20} />
            </div>
          </div>

          <p className="text-2xl font-bold">
            <CountUp
              from={0}
              to={8734}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
            />
          </p>

          <div className="flex justify-between items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className={`text-sm ${colors.green.text}`} />
              <span className={`text-sm ${colors.green.text}`}>
                Up by 30% for last month
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              +111
            </span>
          </div>
        </GlowingCard>

        <GlowingCard
          color={theme && theme === 'dark' ? 'gold' : 'red'}
        >
          <div className="flex justify-between items-center gap-3">
            <span>Total Messages</span>

            <div className={`p-2 ${colors.yellow.active} rounded-lg`}>
              <Send size={20} />
            </div>
          </div>

          <p className="text-2xl font-bold">
            <CountUp
              from={0}
              to={100}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
            />
          </p>

          <div className="flex justify-between items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={16} className={`text-sm ${colors.red.text}`} />
              <span className={`text-sm ${colors.red.text}`}>
                Decline by 20% for last month
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              -74
            </span>
          </div>
        </GlowingCard>

        <GlowingCard
          color={theme && theme === 'dark' ? 'gold' : 'red'}
        >
          <div className="flex justify-between items-center gap-3">
            <span>Total Articles</span>

            <div className={`p-2 ${colors.orange.active} rounded-lg`}>
              <BotMessageSquare size={20} />
            </div>
          </div>

          <p className="text-2xl font-bold">
            <CountUp
              from={0}
              to={1234567}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
            />
          </p>

          <div className="flex justify-between items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className={`text-sm ${colors.green.text}`} />
              <span className={`text-sm ${colors.green.text}`}>
                Up by 12% for last month
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              +15
            </span>
          </div>
        </GlowingCard>

        <GlowingCard
          color={theme && theme === 'dark' ? 'gold' : 'red'}
        >
          <div className="flex justify-between items-center gap-3">
            <span>Average Response Time</span>

            <div className={`p-2 ${colors.violet.active} rounded-lg`}>
              <Hourglass size={20} />
            </div>
          </div>

          <p className="text-2xl font-bold">
            <CountUp
              from={0}
              to={1.2}
              decimalPlaces={1}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
            />
            s
          </p>

          <div className="flex justify-between items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className={`text-sm ${colors.green.text}`} />
              <span className={`text-sm ${colors.green.text}`}>
                Up by 12% for last month
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              +15
            </span>
          </div>
        </GlowingCard>

        <GlowingCard
          color={theme && theme === 'dark' ? 'gold' : 'red'}
        >
          <div className="flex justify-between items-center gap-3">
            <span>Satisfaction Rate</span>

            <div className={`p-2 ${colors.pink.active} rounded-lg`}>
              <ThumbsUp size={20} />
            </div>
          </div>

          <p className="text-2xl font-bold">
            <CountUp
              from={0}
              to={59.21}
              decimalPlaces={2}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
            />
            %
          </p>

          <div className="flex justify-between items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className={`text-sm ${colors.green.text}`} />
              <span className={`text-sm ${colors.green.text}`}>
                Up by 12% for last month
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              +15
            </span>
          </div>
        </GlowingCard>
      </div>

      {/* <div className={styles.chartGrid}>
                <div className={styles.chartRow}>
                    <div className={styles.chartWrapper}>
                        <RadialChart
                            className={styles.chartCard}
                        />
                    </div>
                </div>

                <div className={styles.fullWidth}>

                </div>
            </div> */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-10">
        <TopIntentChart />

        <ReEngagementChart />

        <div className="lg:col-span-2">
          <UserPromptChart />
        </div>
      </div>
    </>
  )
}

