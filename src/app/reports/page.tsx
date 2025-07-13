"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Share2, Eye, Edit } from "lucide-react";



export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">
              View and manage your generated reports and analytics
            </p>
          </div>
          
          <Button asChild>
            <Link href="/upload">Create New Report</Link>
          </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <div className="inline-flex p-3 bg-gray-100 rounded-full mb-4">
              <Download className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Reports Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your data files to generate reports and start analyzing your business insights.
            </p>
            <Button size="lg" asChild>
              <Link href="/upload">
                <Eye className="w-4 h-4 mr-2" />
                Create Your First Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}