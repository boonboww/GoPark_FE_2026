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

import { StaffCard } from "./components/StaffCard";
import { SiteHeader } from "@/components/site-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

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
      setIsCreateDialogOpen(false);
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
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-8 w-full">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Đội ngũ nhân sự
              </h1>
              <p className="text-slate-500 font-medium max-w-lg">
                Quản lý quyền truy cập và nhân viên vận hành tại các điểm đỗ xe.
              </p>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button id="add-staff-btn" className="bg-black hover:bg-slate-800 text-white font-bold px-8 py-7 rounded-[24px] shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3">
                  <UserPlus className="w-6 h-6" />
                  Thêm nhân viên mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 border-none shadow-2xl">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black text-slate-900">
                    Tạo tài khoản mới
                  </DialogTitle>
                  <DialogDescription className="font-medium text-slate-500">
                    Cấp quyền truy cập cho nhân viên vận hành tại bãi đỗ xe.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="parkingLotId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Chọn bãi đỗ xe
                          </FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              setSelectedLotId(val);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger id="staff-lot-select" className="h-12 rounded-xl bg-slate-50 border-transparent focus:ring-0">
                                <SelectValue placeholder="Chọn bãi đỗ xe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              {parkingLots?.map((lot) => (
                                <SelectItem
                                  key={lot.id}
                                  value={lot.id.toString()}
                                  className="rounded-lg"
                                >
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
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Họ và tên
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <Input
                                id="staff-name-input"
                                placeholder="Nguyễn Văn A"
                                className="h-12 pl-12 rounded-xl bg-slate-50 border-transparent focus:ring-0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">
                              Tên định danh
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  id="staff-email-input"
                                  placeholder="hung"
                                  className="h-12 pl-10 rounded-xl bg-slate-50 border-transparent focus:ring-0 text-sm"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">
                              Mật khẩu
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  id="staff-password-input"
                                  type="password"
                                  placeholder="******"
                                  className="h-12 pl-10 rounded-xl bg-slate-50 border-transparent focus:ring-0 text-sm"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Số điện thoại
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <Input
                                id="staff-phone-input"
                                placeholder="0987654321"
                                className="h-12 pl-12 rounded-xl bg-slate-50 border-transparent focus:ring-0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      id="staff-submit-btn"
                      type="submit"
                      className="w-full h-14 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 mt-4"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        "Tạo tài khoản nhân viên"
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and List */}
          <div className="space-y-6">
            <div id="staff-search-filter" className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên..."
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <Select
                    value={selectedLotId || ""}
                    onValueChange={setSelectedLotId}
                  >
                    <SelectTrigger className="w-[200px] border-none bg-transparent shadow-none focus:ring-0 font-bold text-xs">
                      <SelectValue placeholder="Lọc theo bãi" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {parkingLots?.map((lot) => (
                        <SelectItem
                          key={lot.id}
                          value={lot.id.toString()}
                          className="text-xs font-medium"
                        >
                          {lot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoadingStaff ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-slate-50 rounded-[24px] animate-pulse border border-slate-100"
                  />
                ))}
              </div>
            ) : staffList && staffList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {staffList.map((staff) => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-[40px] bg-slate-50/50 border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-2">
                  <User className="h-10 w-10 text-slate-200" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">
                    Chưa có nhân viên
                  </h3>
                  <p className="text-slate-500 font-medium max-w-xs mt-2">
                    {selectedLotId
                      ? "Bãi đỗ này chưa được phân công nhân viên vận hành."
                      : "Vui lòng chọn bãi đỗ xe để xem danh sách nhân sự."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
