import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
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
  object: string;
  count: number;
}

interface BarChartCardProps {
  chartData: ChartData[];
  chartConfig?: any; // Adjust this according to your actual config type
}

const BarChartCard: React.FC<BarChartCardProps> = ({ chartData, chartConfig }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items in Trash</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{
            top: 25,
          }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="object"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 20)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BarChartCard;