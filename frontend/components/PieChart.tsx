import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartData {
  item: string;
  percentage: number;
  fill: string;
}

const chartConfig = {
    percentage: {
      label: "Percentage",
    },
    recyclable: {
      label: "Trash",
      color: "hsl(var(--chart-3))",
    },
    nonRecyclable: {
      label: "Not Trash",
      color: "hsl(var(--chart-1))",
    }
  } satisfies ChartConfig

export const PieChartCard: React.FC<{ chartData: ChartData[] }> = ({ chartData }) => {
  const recyclablePercentage = React.useMemo(() => {
    return chartData.find(data => data.item === "Trash:  ")?.percentage || 0;
  }, [chartData])

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="font-sans text-xl font-semibold subpixel-antialiased">Percentage of Trash Found</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="percentage"
              nameKey="item"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {recyclablePercentage.toFixed(1)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          % Trash Found
                        </tspan>
                      </text>
                    )
                  }
                  return null
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
