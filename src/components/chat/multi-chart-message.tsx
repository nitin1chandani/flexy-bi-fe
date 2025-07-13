"use client";

import { ChartMessage } from "./chart-message";
import { ChartData } from "@/lib/types";

interface MultiChartMessageProps {
  content: string;
}

export function MultiChartMessage({ content }: MultiChartMessageProps) {
  // Extract all chart configurations from the content
  const extractCharts = (text: string): { charts: ChartData[], message: string } => {
    const charts: ChartData[] = [];
    let cleanMessage = text;

    try {
      console.log('🔍 Extracting charts from content:', text.substring(0, 200) + '...');

      // Method 1: Find complete JSON objects with balanced braces
      const findJsonObjects = (str: string) => {
        const objects = [];
        let braceCount = 0;
        let start = -1;

        for (let i = 0; i < str.length; i++) {
          if (str[i] === '{') {
            if (braceCount === 0) start = i;
            braceCount++;
          } else if (str[i] === '}') {
            braceCount--;
            if (braceCount === 0 && start !== -1) {
              objects.push(str.substring(start, i + 1));
              start = -1;
            }
          }
        }
        return objects;
      };

      const jsonObjects = findJsonObjects(text);
      console.log('📋 Found JSON objects:', jsonObjects.length);

      for (const jsonStr of jsonObjects) {
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('📊 Parsed object:', parsed);

          // Handle different chart formats
          let chartConfig = null;

          if (parsed.response_type === 'chart' && parsed.chart_config) {
            // Format 1: { response_type: "chart", chart_config: {...} }
            chartConfig = {
              ...parsed.chart_config,
              insights: parsed.insights || parsed.chart_config.insights || []
            };
          } else if (parsed.chart_config && (parsed.chart_config.type || parsed.chart_config.chart_type)) {
            // Format 2: { chart_config: { type: "pie", ... } }
            chartConfig = {
              ...parsed.chart_config,
              insights: parsed.insights || parsed.chart_config.insights || []
            };
          } else if (parsed.type && ['pie', 'bar', 'line', 'scatter', 'doughnut'].includes(parsed.type)) {
            // Format 3: Direct chart object { type: "pie", title: "...", data: {...} }
            chartConfig = {
              ...parsed,
              insights: parsed.insights || []
            };
          }

          if (chartConfig) {
            // Ensure the chart has required fields
            if (!chartConfig.title) {
              chartConfig.title = 'Chart';
            }

            charts.push(chartConfig);
            console.log('✅ Added chart:', chartConfig.title);

            // Remove the JSON from the message
            cleanMessage = cleanMessage.replace(jsonStr, '').trim();
          }
        } catch (parseError) {
          console.log('⚠️ Failed to parse JSON:', parseError);
        }
      }

      // Clean up the message
      cleanMessage = cleanMessage
        .replace(/\s+/g, ' ')
        .replace(/^\s*,?\s*/, '')
        .replace(/\s*,?\s*$/, '')
        .trim();

    } catch (error) {
      console.log('❌ Error extracting charts:', error);
    }

    console.log('📈 Extracted charts:', charts.length, 'Clean message:', cleanMessage.substring(0, 100));
    return { charts, message: cleanMessage };
  };

  const { charts, message } = extractCharts(content);

  if (charts.length === 0) {
    // No charts found, render as regular message
    return (
      <div className="text-sm leading-relaxed">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Message */}
      {message && (
        <div className="text-sm leading-relaxed mb-4">
          {message}
        </div>
      )}
      
      {/* Render all charts */}
      {charts.map((chartData, index) => (
        <ChartMessage 
          key={index}
          chartData={chartData} 
          message={`Chart ${index + 1}: ${chartData.title}`}
        />
      ))}
    </div>
  );
}
