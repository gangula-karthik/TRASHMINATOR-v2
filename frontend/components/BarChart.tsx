import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartData {
  object: string;
  count: number;
}

interface BarChartCardProps {
  chartData: ChartData[];
  chartConfig?: any;
}

const BarChartCard: React.FC<BarChartCardProps> = ({ chartData, chartConfig }) => {
  const colors = [
    "#5865F2", // Blurple
    "#57F287", // Green
    "#FEE75C", // Yellow
    "#EB459E", // Fuchsia
    "#FFA07A", // Coral
    "#1ABC9C", // Teal
    "#3498DB", // Blue
  ];

const processedData = chartData
  .sort((a, b) => b.count - a.count) // Sort by count in descending order
  .slice(0, 6) // Ensure only top 6 items are shown
  .map((item, index) => {
    let formattedObject;
    const words = item.object.split(' '); // Split into words

    if (words.length === 3) {
      // For three words, place first two on top and third below
      formattedObject = `${words[1]}\n${words[2]}`;
    } else if (words.length === 2) {
      // For two words, each word on a separate line
      formattedObject = `${words[0]}\n${words[1]}`;
    } else {
      // For one word or other cases, use as-is
      formattedObject = item.object;
    }

    return {
      ...item,
      formattedObject,
      fill: colors[index % colors.length],
    };
  });


  // Custom tick renderer for multi-line labels
  const renderCustomTick = (props: any) => {
    const { x, y, payload } = props;
    const lines = payload.value.split('\n'); // Split label into lines based on '\n'

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="var(--color-text)"
        fontSize={11}
      >
        {lines.map((line: string, index: number) => (
          <tspan x={x} dy={index === 0 ? 0 : 14} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items in Trash</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={processedData}
            margin={{
              top: 20,
              right: 0,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="formattedObject"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
              tick={renderCustomTick} // Use custom tick renderer
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              content={<ChartTooltipContent hideLabel />}
              animationDuration={200}
            />
            <Bar
              dataKey="count"
              radius={[8, 8, 8, 8]}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={10}
                formatter={(value: number) => Math.round(value)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BarChartCard;
