"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, DollarSign, Wallet, UserX } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${type}?format=excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold ">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Installers Report</CardTitle>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardDescription>
              Export complete installer data to Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadReport("installers")}
              disabled={loading}
              className="w-full"
            >
              Download Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rewards Report</CardTitle>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <CardDescription>
              Export complete rewards data to Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadReport("rewards")}
              disabled={loading}
              className="w-full"
            >
              Download Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Format</CardTitle>
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <CardDescription>
              Export payment-ready format for bulk processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadReport("payment-format")}
              disabled={loading}
              className="w-full"
            >
              Download Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Non Certified Installers</CardTitle>
              <UserX className="h-8 w-8 text-primary" />
            </div>
            <CardDescription>
              Export non-certified installer contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadReport("non-certified-installers")}
              disabled={loading}
              className="w-full"
            >
              Download Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select>
                <SelectTrigger id="payment-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" />
            </div>
          </div>
          <div className="mt-4">
            <Button>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
