"use client";

import { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { ChartData } from "@/lib/types";

interface ChartMessageProps {
  chartData: ChartData;
  message: string;
}

export function ChartMessage({ chartData, message }: ChartMessageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!canvasRef.current) return;

      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      // Destroy existing chart if it exists
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: chartData.type,
        data: chartData.data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: chartData.title,
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              position: 'top' as const,
            },
          },
          ...chartData.options
        },
      });
    };

    renderChart();

    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartData]);

  const downloadChart = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${chartData.title.replace(/\s+/g, '_')}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{chartData.title}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={downloadChart}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* AI Message */}
        <div className="mb-4">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Chart Canvas */}
        <div className="relative h-96 mb-4">
          <canvas ref={canvasRef} />
        </div>

        {/* Insights */}
        {chartData.insights && chartData.insights.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Insights:</h4>
            <ul className="list-disc list-inside space-y-1">
              {chartData.insights.map((insight, index) => (
                <li key={index} className="text-blue-800 text-sm">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
