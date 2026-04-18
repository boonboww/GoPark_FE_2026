"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  Wallet,
  Loader2,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  UserCircle2,
  CreditCard,
  TrendingUp,
  Banknote,
  ChevronRight,
  ChevronLeft,
  Info,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { useWallet, useWalletTransactions } from "@/hooks/useWallet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const VIETNAM_BANKS = [
  "Vietcombank",
  "Techcombank",
  "BIDV",
  "Agribank",
  "VietinBank",
  "MB Bank",
  "TPBank",
  "ACB",
  "VPBank",
  "Sacombank",
];

export default function OwnerWalletPage() {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const user = useAuthStore((state) => state.user);
  const {
    data: balance,
    isLoading: isFetchingWallet,
    isError: isWalletError,
    refetch: refetchWallet,
  } = useWallet();
  const {
    data: allTransactions,
    isLoading: isFetchingTransactions,
    refetch: refetchTransactions,
  } = useWalletTransactions();

  const handleActivateWallet = async () => {
    setIsActivating(true);
    try {
      await apiClient("/wallets/init", {
        method: "POST",
        body: JSON.stringify({ userId: user?.id }),
      });
      toast.success("Kích hoạt ví thành công!");
      refetchWallet();
    } catch (e) {
      toast.error("Có lỗi khi kích hoạt ví. Vui lòng thử lại sau.");
      console.error(e);
    } finally {
      setIsActivating(false);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseInt(amount);

    if (isNaN(numAmount) || numAmount < 100000) {
      toast.error("Số tiền rút tối thiểu là 100.000 VNĐ");
      return;
    }

    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng");
      return;
    }

    if (balance && numAmount > balance) {
      toast.error("Số dư không đủ để thực hiện giao dịch");
      return;
    }

    setIsLoading(true);

    try {
      const bankInfo = JSON.stringify({
        bank: bankName,
        account: accountNumber,
        holder: accountHolder,
      });

      await apiClient("/wallets/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: numAmount,
          userId: user?.id,
          refId: bankInfo,
        }),
      });

      toast.success("Gửi yêu cầu rút tiền thành công!");
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
      refetchWallet();
      refetchTransactions();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi gửi yêu cầu rút tiền");
    } finally {
      setIsLoading(false);
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
        <SiteHeader />

        <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
          {/* Header Section */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              Ví tiền
            </h1>
            <p className="text-sm text-muted-foreground w-full">
              Quản lý doanh thu và yêu cầu chuyển tiền về tài khoản ngân hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Left Column: Stats & Form (4/12) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 md:space-y-8">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between pb-2">
                    <CardDescription className="text-muted-foreground font-semibold uppercase tracking-widest text-xs">
                      Tổng doanh thu hiện có
                    </CardDescription>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-4xl font-bold tracking-tight text-foreground mt-2">
                    {isFetchingWallet ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : isWalletError ? (
                      <span className="text-2xl text-muted-foreground">
                        Chưa kích hoạt
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        {(balance || 0).toLocaleString("vi-VN")}
                        <span className="text-xl font-medium text-muted-foreground ml-1">
                          ₫
                        </span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isWalletError ? (
                    <Button
                      onClick={handleActivateWallet}
                      disabled={isActivating}
                      variant="default"
                      className="w-full h-11"
                    >
                      {isActivating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="mr-2 h-4 w-4" />
                      )}
                      Kích hoạt ví ngay
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between bg-muted rounded-xl p-3 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                            Trạng thái ví
                          </p>
                          <p className="text-sm text-foreground font-medium">
                            Đang hoạt động
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-foreground">
                        Verified
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdraw Form Card */}
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                        Rút tiền
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Yêu cầu chuyển doanh thu về ngân hàng
                      </CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
                      <Banknote className="h-3 w-3 text-emerald-500" /> Số tiền
                      muốn rút
                    </Label>
                    <div className="relative group">
                      <Input
                        type="number"
                        placeholder="Tối thiểu 100.000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-14 border-slate-200 rounded-2xl focus-visible:ring-emerald-500 pl-5 pr-12 font-black text-xl text-slate-900 group-hover:border-slate-300 transition-all shadow-sm"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg select-none">
                        ₫
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 pl-1">
                      <Info className="h-3 w-3" /> Hạn mức rút tối thiểu là
                      100.000 ₫
                    </p>
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="space-y-4 pt-1">
                    <div className="grid gap-2">
                      <Label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
                        Ngân hàng thụ hưởng
                      </Label>
                      <Select value={bankName} onValueChange={setBankName}>
                        <SelectTrigger className="h-12 border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white transition-colors">
                          <SelectValue placeholder="Chọn ngân hàng" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIETNAM_BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
                        Số tài khoản
                      </Label>
                      <Input
                        placeholder="Nhập số tài khoản"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="h-12 border-slate-200 rounded-xl bg-slate-50/30 focus-visible:bg-white transition-all shadow-sm"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
                        Tên chủ tài khoản
                      </Label>
                      <Input
                        placeholder="VD: NGUYEN VAN A"
                        value={accountHolder}
                        onChange={(e) =>
                          setAccountHolder(e.target.value.toUpperCase())
                        }
                        className="h-12 border-slate-200 rounded-xl bg-slate-50/30 focus-visible:bg-white transition-all shadow-sm uppercase font-black"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    variant="default"
                    className="w-full h-12"
                    onClick={handleWithdraw}
                    disabled={isLoading || !amount || parseInt(amount) < 100000}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="mr-2 h-4 w-4" />
                    )}
                    Gửi yêu cầu rút tiền
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Column: Enhanced Transactions History (8/12) */}
            <div className="lg:col-span-7 xl:col-span-8">
              <PaginatedTransactionHistory
                allTransactions={allTransactions}
                isLoading={isFetchingTransactions}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PaginatedTransactionHistory({
  allTransactions,
  isLoading,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: {
  allTransactions: any[] | undefined;
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: (fn: (p: number) => number) => void;
  itemsPerPage: number;
}) {
  const [activeTab, setActiveTab] = useState("all");

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setCurrentPage(() => 1);
  };

  const filteredAll = allTransactions ?? [];
  const filteredIncome = filteredAll.filter(
    (t) => t.type === "EARN_PARKING_FEE",
  );
  const filteredOutcome = filteredAll.filter((t) => t.type === "WITHDRAW");

  const dataByTab: Record<string, any[]> = {
    all: filteredAll,
    income: filteredIncome,
    outcome: filteredOutcome,
  };

  const activeData = dataByTab[activeTab] ?? [];
  const totalPages = Math.max(1, Math.ceil(activeData.length / itemsPerPage));

  const pagedAll = filteredAll.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const pagedIncome = filteredIncome.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const pagedOutcome = filteredOutcome.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const badgeCounts: Record<string, number> = {
    all: filteredAll.length,
    income: filteredIncome.length,
    outcome: filteredOutcome.length,
  };

  return (
    <Card className="border-border bg-card h-full flex flex-col overflow-hidden shadow-sm">
      <Tabs
        defaultValue="all"
        className="flex flex-col h-full"
        onValueChange={handleTabChange}
      >
        <CardHeader className="border-b border-border flex-none px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Lịch sử biến động
            </CardTitle>
            <CardDescription className="text-xs">
              Tổng {activeData.length} giao dịch — đang xem trang {currentPage}/
              {totalPages}
            </CardDescription>
          </div>
          <TabsList className="bg-slate-100 rounded-lg p-1 h-10 w-fit shrink-0">
            {[
              { value: "all", label: "Tất cả" },
              { value: "income", label: "Thu nhập" },
              { value: "outcome", label: "Đã rút" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-md text-[11px] font-bold px-3 gap-1.5"
              >
                {tab.label}
                {badgeCounts[tab.value] > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-slate-200/80 text-slate-600 text-[9px] font-black">
                    {badgeCounts[tab.value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col min-h-[400px]">
          <div className="flex-1 overflow-auto">
            <TabsContent value="all" className="m-0">
              <TransactionList
                transactions={isLoading ? undefined : pagedAll}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="income" className="m-0">
              <TransactionList
                transactions={isLoading ? undefined : pagedIncome}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="outcome" className="m-0">
              <TransactionList
                transactions={isLoading ? undefined : pagedOutcome}
                isLoading={isLoading}
              />
            </TabsContent>
          </div>

          {/* Pagination Footer */}
          {!isLoading && activeData.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/30 flex items-center justify-between shrink-0">
              <p className="text-xs text-slate-500 font-bold">
                {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, activeData.length)} /{" "}
                {activeData.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-lg font-bold border-slate-200 gap-1"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>

                {/* Page indicator pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(
                      Math.max(0, currentPage - 2),
                      Math.min(totalPages, currentPage + 1),
                    )
                    .map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(() => pg)}
                        className={`h-8 w-8 rounded-md text-xs font-medium transition-all ${
                          pg === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-lg font-bold border-slate-200 gap-1 group"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Tiếp{" "}
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
}

function TransactionList({
  transactions,
  isLoading,
}: {
  transactions: any[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-20 text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-500/30" />
        <p className="text-slate-400 font-bold tracking-tight">
          Đang tải lịch sử...
        </p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center opacity-40">
        <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 rotate-12 group-hover:rotate-0 transition-transform">
          <History className="h-10 w-10 text-slate-300" />
        </div>
        <p className="text-slate-400 font-black tracking-tight text-xl uppercase">
          Chưa có giao dịch nào
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((tx: any) => {
        const isIncome =
          tx.type === "EARN_PARKING_FEE" || Number(tx.amount) > 0;
        const status = tx.status || "SUCCESS";

        return (
          <div
            key={tx.id}
            className="group hover:bg-slate-50/80 transition-all duration-300 p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-5">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border border-border ${
                  isIncome
                    ? "bg-muted text-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {isIncome ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5" />
                )}
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-base">
                  {tx.type === "EARN_PARKING_FEE"
                    ? "Nhận tiền phí đỗ xe"
                    : tx.type === "WITHDRAW"
                      ? "Yêu cầu rút tiền"
                      : "Biến động số dư"}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-bold text-slate-400">
                    {new Date(tx.created_at || tx.createdAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                  <span className="h-1 w-1 rounded-full bg-slate-300 " />
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-tighter">
                    {new Date(tx.created_at || tx.createdAt).toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p
                className={`font-semibold text-base ${
                  isIncome ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {isIncome ? "+" : ""}
                {Number(tx.amount).toLocaleString("vi-VN")}
                <span className="text-sm ml-1 select-none">₫</span>
              </p>
              <div className="mt-1.5">
                {status === "PENDING" ? (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-5 px-2"
                  >
                    Đang xử lý
                  </Badge>
                ) : status === "SUCCESS" ? (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-5 px-2 border-foreground"
                  >
                    Hoàn tất
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-5 px-2 border-muted-foreground text-muted-foreground"
                  >
                    {status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
