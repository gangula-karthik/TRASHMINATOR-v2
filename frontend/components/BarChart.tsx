import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  month: string;
  desktop: number;
}

interface BarChartCardProps {
  chartData: ChartData[];
  chartConfig?: any; // Adjust this according to your actual config type
}

const BarChartCard: React.FC<BarChartCardProps> = ({ chartData, chartConfig }) => {
  return (
    <Card>
    <CardHeader>
      <CardTitle>Bar Chart</CardTitle>
      <CardDescription>January - June 2024</CardDescription>
    </CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
        </BarChart>
      </ChartContainer>
    </CardContent>
    <CardFooter className="flex-col items-start gap-2 text-sm">
      <div className="flex gap-2 font-medium leading-none">
        Trending up by 5.2% this month <TrendingUp className="size-4" />
      </div>
      <div className="text-muted-foreground leading-none">
        Showing total visitors for the last 6 months
      </div>
    </CardFooter>
  </Card>
  );
};

export default BarChartCard;