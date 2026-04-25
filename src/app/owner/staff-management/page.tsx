"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Trash2,
  Building2,
  Search,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { userService } from "@/services/userService";
import { useOwnerParkingLots } from "@/hooks/useOwnerParkingLots";

const formSchema = z.object({
  email: z.string().min(1, {
    message: "Vui lòng nhập tên định danh.",
  }),
  password: z
    .string()
    .min(6, {
      message: "Mật khẩu phải có ít nhất 6 ký tự.",
    })
    .max(13, {
      message: "Mật khẩu không được quá 13 ký tự.",
    }),
  fullName: z.string().min(1, {
    message: "Họ và tên không được để trống.",
  }),
  phoneNumber: z.string().optional().or(z.literal("")),
  parkingLotId: z.string({
    required_error: "Vui lòng chọn bãi đỗ xe.",
  }),
});

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [selectedLotId, setSelectedLotId] = React.useState<string | null>(null);
  
  const { data: parkingLots } = useOwnerParkingLots();
  
  const { data: staffList, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff", selectedLotId],
    queryFn: () => userService.getStaffByParkingLot(Number(selectedLotId)),
    enabled: !!selectedLotId,
  });

  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => userService.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", selectedLotId] });
      toast.success("Xóa nhân viên thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi xóa nhân viên.");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phoneNumber: "",
      parkingLotId: "",
    },
  });

  // Set default lot if available
  React.useEffect(() => {
    if (parkingLots && parkingLots.length > 0 && !selectedLotId) {
      const firstLotId = parkingLots[0].id.toString();
      setSelectedLotId(firstLotId);
      form.setValue("parkingLotId", firstLotId);
    }
  }, [parkingLots, selectedLotId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        parkingLotId: Number(values.parkingLotId),
        phoneNumber: values.phoneNumber === "" ? undefined : values.phoneNumber,
      };

      await userService.createStaff(payload);

      toast.success("Tạo tài khoản nhân viên thành công!");
      queryClient.invalidateQueries({ queryKey: ["staff", selectedLotId] });
      form.reset({
        ...form.getValues(),
        email: "",
        password: "",
        fullName: "",
        phoneNumber: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra.");
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhân viên ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

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
        <div className="flex-1 space-y-8 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Quản lý nhân viên</h2>
              <p className="text-muted-foreground">
                Quản lý đội ngũ nhân viên vận hành tại các bãi đỗ xe của bạn.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-7">
            {/* Create Staff Form */}
            <Card className="lg:col-span-3 h-fit border-sidebar-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Thêm nhân viên mới
                </CardTitle>
                <CardDescription>
                  Tạo tài khoản mới cho nhân viên. Email sẽ được tự động định dạng theo bãi xe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="parkingLotId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chọn bãi đỗ xe</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              setSelectedLotId(val);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn bãi đỗ xe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {parkingLots?.map((lot) => (
                                <SelectItem key={lot.id} value={lot.id.toString()}>
                                  {lot.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nguyễn Văn A" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên định danh (Email prefix)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="hung" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground mt-1">
                             Hệ thống sẽ lưu thành: staff.{selectedLotId || "[id]"}.{field.value || "[tên]"}@gopark.com
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="******" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="0987654321" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Tạo tài khoản"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Staff List */}
            <Card className="lg:col-span-4 border-sidebar-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Danh sách nhân viên</CardTitle>
                  <CardDescription>
                    {selectedLotId 
                      ? `Nhân viên tại ${parkingLots?.find(l => l.id.toString() === selectedLotId)?.name}`
                      : "Vui lòng chọn bãi đỗ xe để xem danh sách"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <Building2 className="h-4 w-4 text-muted-foreground" />
                   <Select value={selectedLotId || ""} onValueChange={setSelectedLotId}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Lọc theo bãi" />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingLots?.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id.toString()}>
                            {lot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStaff ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : staffList && staffList.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nhân viên</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffList.map((staff) => (
                          <TableRow key={staff.id}>
                            <TableCell>
                              <div className="font-medium">{staff.profile.name}</div>
                              <div className="text-xs text-muted-foreground">{staff.profile.phone || "N/A"}</div>
                            </TableCell>
                            <TableCell>
                              <code className="rounded bg-muted px-1 py-0.5 text-xs">{staff.email}</code>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(staff.id, staff.profile.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center space-y-2 rounded-md border border-dashed">
                    <Search className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">Chưa có nhân viên nào tại bãi này.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
