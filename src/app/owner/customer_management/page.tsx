"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { FormAddCustomer } from "./form_add_customer";

// Mock data
const mockCustomers = [
  {
    id: "KH001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    vehicles: ["30A-123.45", "29B-678.90"],
  },
  {
    id: "KH002",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0912345678",
    vehicles: ["51C-456.78"],
  },
  {
    id: "KH003",
    name: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0987654321",
    vehicles: ["43C-347.19", "22A-442.11"],
  },
];

export default function CustomerManagementPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 md:gap-8 px-4 lg:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm theo ID, tên..."
                      className="max-w-sm"
                    />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm khách hàng
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[600px] sm:max-w-[calc(100vw-2rem)]">
                      <SheetHeader>
                        <SheetTitle>Đăng ký khách hàng mới</SheetTitle>
                        <SheetDescription>
                          Nhập thông tin khách hàng và xe để thêm vào hệ thống.
                        </SheetDescription>
                      </SheetHeader>
                      <FormAddCustomer />
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Tên khách hàng</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Xe</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.id}
                          </TableCell>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>
                            <Select defaultValue={customer.vehicles[0]}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Chọn xe" />
                              </SelectTrigger>
                              <SelectContent>
                                {customer.vehicles.map((vehicle) => (
                                  <SelectItem key={vehicle} value={vehicle}>
                                    {vehicle}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Sửa</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Xóa</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
