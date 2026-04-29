"use client";

import { useState, useEffect } from "react";
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

import { useRouter } from "next/navigation";

export default function OwnerWalletPage() {
  const router = useRouter();
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

      const res = await apiClient<any>("/wallets/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: numAmount,
          userId: user?.id,
          refId: bankInfo,
        }),
      });

      const txId = res?.data?.id || res?.id;
      if (txId) {
        toast.success("Gửi yêu cầu rút tiền thành công!");
        router.push(`/owner/wallet/withdraw/pending/${txId}`);
      } else {
        toast.error("Không tìm thấy mã giao dịch sau khi rút.");
      }
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
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 w-full">
          {/* COMPACT TOP STATS - 100% VIETNAMESE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden border-none shadow-lg bg-slate-900 p-5 group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transition-all group-hover:bg-emerald-500/20" />
              <div className="flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Số dư khả dụng</p>
                  <Wallet className="h-4 w-4 text-emerald-500/50" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-white tracking-tighter">
                    {isFetchingWallet ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white/20" />
                    ) : (
                      <>
                        {(balance || 0).toLocaleString("vi-VN")}
                        <span className="text-lg font-medium text-emerald-500/60 ml-1">₫</span>
                      </>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Ví đang hoạt động</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-all">
               <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                     <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Thu nhập</span>
               </div>
               <div className="mt-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu hôm nay</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    +1.200.000 <span className="text-sm font-bold text-slate-400">₫</span>
                  </h3>
               </div>
            </Card>

            <Card className="bg-white border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-all">
               <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                     <ArrowDownLeft className="h-4 w-4 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase">Đã rút</span>
               </div>
               <div className="mt-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền đã rút</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    45.000.000 <span className="text-sm font-bold text-slate-400">₫</span>
                  </h3>
               </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* BALANCED TRANSFER INTERFACE - 5 COLS */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <Card className="border-none shadow-xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="bg-slate-900 px-6 py-5">
                   <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <CardTitle className="text-white text-lg font-black tracking-tight">Rút tiền nhanh 24/7</CardTitle>
                        <CardDescription className="text-emerald-400 text-[10px] uppercase font-black tracking-widest">Giao dịch an toàn • GoPark Business</CardDescription>
                     </div>
                     <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Landmark className="text-white/40 w-5 h-5" />
                     </div>
                   </div>
                </CardHeader>

                <CardContent className="p-7 space-y-7">
                  {/* BANK LOGO GRID */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                       <Label className="text-slate-900 font-black text-[11px] uppercase tracking-widest pl-1">Chọn ngân hàng thụ hưởng</Label>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                       {[
                         { id: "VCB", name: "Vietcombank" },
                         { id: "TCB", name: "Techcombank" },
                         { id: "MB", name: "MB Bank" },
                         { id: "BIDV", name: "BIDV" },
                         { id: "ICB", name: "VietinBank" },
                         { id: "ACB", name: "ACB" },
                         { id: "VPB", name: "VPBank" },
                         { id: "STB", name: "Sacombank" },
                         { id: "TPB", name: "TPBank" },
                         { id: "HDB", name: "HDBank" },
                       ].map((bank) => (
                         <button
                           key={bank.id}
                           onClick={() => setBankName(bank.name)}
                           className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                             bankName === bank.name 
                             ? "border-emerald-500 bg-emerald-50 shadow-md scale-105" 
                             : "border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                           }`}
                         >
                            <img 
                              src={`https://api.vietqr.io/img/${bank.id}.png`} 
                              alt={bank.name}
                              className={`h-7 w-auto object-contain ${bankName === bank.name ? "" : "grayscale opacity-60"}`}
                            />
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* INPUT FIELDS */}
                  <div className="space-y-5">
                    <div className="grid gap-2">
                       <Label className="text-slate-900 font-black text-[11px] uppercase tracking-widest pl-1">Số tài khoản</Label>
                       <Input
                         placeholder="Ví dụ: 1903..."
                         value={accountNumber}
                         onChange={(e) => setAccountNumber(e.target.value)}
                         className="h-13 border-slate-200 rounded-xl font-bold text-base focus-visible:ring-emerald-500 shadow-sm"
                       />
                    </div>
                    <div className="grid gap-2">
                       <Label className="text-slate-900 font-black text-[11px] uppercase tracking-widest pl-1">Họ tên chủ tài khoản</Label>
                       <Input
                         placeholder="NGUYEN VAN A"
                         value={accountHolder}
                         onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                         className="h-13 border-slate-200 rounded-xl font-black text-base uppercase focus-visible:ring-emerald-500 shadow-sm"
                       />
                    </div>
                    <div className="grid gap-2">
                       <Label className="text-slate-900 font-black text-[11px] uppercase tracking-widest pl-1">Số tiền cần rút</Label>
                       <div className="relative group">
                         <Input
                           type="number"
                           placeholder="Tối thiểu 100.000"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="h-16 border-slate-200 rounded-2xl font-black text-2xl pl-6 pr-12 focus-visible:ring-emerald-500 bg-slate-50 group-hover:bg-white transition-all shadow-inner"
                         />
                         <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">₫</span>
                       </div>
                       <div className="flex justify-between items-center px-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">* Phí chuyển khoản: 0₫</p>
                          <button 
                            onClick={() => setAmount((balance || 0).toString())}
                            className="text-[10px] text-emerald-600 font-black uppercase tracking-widest hover:underline"
                          >
                            Rút hết số dư
                          </button>
                       </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                    onClick={handleWithdraw}
                    disabled={isLoading || !amount || parseInt(amount) < 100000 || !bankName || !accountNumber}
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Xác nhận giao dịch"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* REBALANCED TRANSACTION HISTORY - 7 COLS */}
            <div className="lg:col-span-12 xl:col-span-7">
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
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  // Load last seen timestamps from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("owner_wallet_last_seen");
      if (saved) {
        try {
          setLastSeen(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing wallet last seen data", e);
        }
      }
    }
  }, []);

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

  // Update last seen when active tab changes or new transactions arrive
  useEffect(() => {
    if (activeTab && dataByTab[activeTab] && dataByTab[activeTab].length > 0) {
      const latestTx = dataByTab[activeTab][0];
      const latestTime = latestTx.created_at || latestTx.createdAt;
      
      setLastSeen(prev => {
        if (latestTime && latestTime !== prev[activeTab]) {
          const newState = { ...prev, [activeTab]: latestTime };
          localStorage.setItem("owner_wallet_last_seen", JSON.stringify(newState));
          return newState;
        }
        return prev;
      });
    }
  }, [activeTab, allTransactions]);

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
    all: filteredAll.filter(t => {
      const txTime = t.created_at || t.createdAt;
      return lastSeen["all"] && new Date(txTime) > new Date(lastSeen["all"]);
    }).length,
    income: filteredIncome.filter(t => {
      const txTime = t.created_at || t.createdAt;
      return lastSeen["income"] && new Date(txTime) > new Date(lastSeen["income"]);
    }).length,
    outcome: filteredOutcome.filter(t => {
      const txTime = t.created_at || t.createdAt;
      return lastSeen["outcome"] && new Date(txTime) > new Date(lastSeen["outcome"]);
    }).length,
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
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <History className="h-6 w-6 text-slate-400" />
              Lịch sử biến động
            </CardTitle>
            <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng {activeData.length} giao dịch — Trang {currentPage}/{totalPages}
            </CardDescription>
          </div>
          <TabsList className="bg-slate-100 rounded-xl p-1 h-12 w-fit shrink-0">
            {[
              { value: "all", label: "Tất cả" },
              { value: "income", label: "Thu nhập" },
              { value: "outcome", label: "Đã rút" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg text-sm font-black px-5 gap-2 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                {tab.label}
                {badgeCounts[tab.value] > 0 && (
                  <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-black transition-all ${
                    activeTab === tab.value 
                    ? 'bg-slate-900 text-white opacity-0 scale-0' 
                    : 'bg-red-500 text-white shadow-sm shadow-red-200'
                  }`}>
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
