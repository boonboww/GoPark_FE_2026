"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parkingService } from "@/services/parking.service";
import { useCustomerStore } from "@/stores/customer.store";
import { toast } from "sonner";
import {
  Edit2, Save, X, Loader2, Plus, ChevronDown, ChevronUp,
  Layers, MapPin, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────────────────
interface FloorPayload {
  floor_name: string;
  floor_number: number;
  description?: string;
}

interface ZonePayload {
  zone_name: string;
  total_slots: number;
  description?: string;
}

// ──────────────────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────────────────
export function StructureManagerTab() {
  const { lotId } = useCustomerStore();
  const queryClient = useQueryClient();

  const { data: floorsResponse, isLoading } = useQuery({
    queryKey: ["parkingLotFloors", lotId],
    queryFn: () => parkingService.getFloors(lotId as number),
    enabled: !!lotId,
  });

  const floors: any[] = floorsResponse?.data ?? [];

  // ─── UI state ─────────────────────────────────────────
  const [expandedFloor, setExpandedFloor] = React.useState<number | null>(null);
  const [editingFloor, setEditingFloor]   = React.useState<number | null>(null);
  const [editingZone, setEditingZone]     = React.useState<number | null>(null);
  const [addingZone, setAddingZone]       = React.useState<number | null>(null); // floorId
  const [addingFloor, setAddingFloor]     = React.useState(false);

  // ─── Edit form state ───────────────────────────────────
  const [floorForm, setFloorForm]   = React.useState<Record<string, string | number>>({});
  const [zoneForm, setZoneForm]     = React.useState<Record<string, string | number>>({});
  const [newFloorForm, setNewFloorForm] = React.useState<FloorPayload>({
    floor_name: "", floor_number: 1, description: ""
  });
  const [newZoneForm, setNewZoneForm] = React.useState<ZonePayload & {
    prefix: string; priceHour: number; priceDay: number
  }>({ zone_name: "", total_slots: 10, description: "", prefix: "A", priceHour: 20000, priceDay: 150000 });

  // ─── Mutations ─────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["parkingLotFloors", lotId] });
  };

  // Update floor
  const updateFloorMut = useMutation({
    mutationFn: (payload: { id: number } & FloorPayload) =>
      parkingService.updateFloor(lotId as number, payload.id, {
        floor_name: payload.floor_name,
        description: payload.description,
      }),
    onSuccess: () => { toast.success("Cập nhật tầng thành công"); invalidate(); setEditingFloor(null); },
    onError: (err: any) => toast.error(err.message || "Lỗi cập nhật tầng"),
  });

  // Update zone + pricing
  const updateZoneMut = useMutation({
    mutationFn: async (payload: any) => {
      await parkingService.updateZone(lotId as number, payload.floorId, payload.id, {
        zone_name: payload.zone_name,
        description: payload.description,
        total_slots: Number(payload.total_slots),
      });
      try {
        const ruleId = payload.rule_id ?? payload.id;
        await parkingService.updatePricingRule(
          lotId as number, payload.floorId, payload.id, ruleId,
          { price_per_hour: Number(payload.priceHour), price_per_day: Number(payload.priceDay) }
        );
      } catch { /* pricing may not exist yet – non-blocking */ }
    },
    onSuccess: () => { toast.success("Cập nhật khu vực & giá thành công"); invalidate(); setEditingZone(null); },
    onError: (err: any) => toast.error(err.message || "Lỗi cập nhật khu vực"),
  });

  // Create new floor
  const createFloorMut = useMutation({
    mutationFn: () => parkingService.createFloor(lotId as number, {
      floor_name: newFloorForm.floor_name,
      floor_number: newFloorForm.floor_number,
      description: newFloorForm.description || `Khu vực ${newFloorForm.floor_name}`,
    }),
    onSuccess: () => {
      toast.success("Thêm tầng mới thành công!");
      invalidate();
      setAddingFloor(false);
      setNewFloorForm({ floor_name: "", floor_number: floors.length + 2, description: "" });
    },
    onError: (err: any) => toast.error(err.message || "Lỗi thêm tầng"),
  });

  // Create new zone + pricing
  const createZoneMut = useMutation({
    mutationFn: async (floorId: number) => {
      const res: any = await parkingService.createZone(floorId, {
        zone_name: newZoneForm.zone_name,
        total_slots: Number(newZoneForm.total_slots),
        description: `Khu vực ${newZoneForm.zone_name} - Tiền tố ${newZoneForm.prefix}`,
      });
      const newZoneId = res?.data?.id;
      if (newZoneId && lotId) {
        await parkingService.createPricingRule({
          price_per_hour: Number(newZoneForm.priceHour),
          price_per_day: Number(newZoneForm.priceDay),
          parking_lot_id: lotId as number,
          parking_floor_id: floorId,
          parking_zone_id: newZoneId,
        });
      }
    },
    onSuccess: () => {
      toast.success("Thêm khu vực mới & thiết lập giá thành công!");
      invalidate();
      setAddingZone(null);
      setNewZoneForm({ zone_name: "", total_slots: 10, description: "", prefix: "A", priceHour: 20000, priceDay: 150000 });
    },
    onError: (err: any) => toast.error(err.message || "Lỗi thêm khu vực"),
  });

  // ─── Handlers ──────────────────────────────────────────
  const startEditFloor = (floor: any) => {
    setEditingFloor(floor.id);
    setFloorForm({ floor_name: floor.floor_name, description: floor.description ?? "" });
  };

  const startEditZone = (floorId: number, zone: any) => {
    setEditingZone(zone.id);
    setZoneForm({
      floorId,
      id: zone.id,
      zone_name: zone.zone_name,
      description: zone.description ?? "",
      total_slots: zone.total_slots,
      priceHour: zone.priceHour ?? 20000,
      priceDay: zone.priceDay ?? 150000,
    });
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b bg-white flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Cấu trúc Bãi đỗ</h2>
          <p className="text-sm text-slate-500 mt-0.5">Thêm, sửa tầng và khu vực đang hoạt động</p>
        </div>
        <Button
          onClick={() => { setAddingFloor(true); setExpandedFloor(null); }}
          className="bg-black text-white hover:bg-slate-800 font-semibold shadow-md"
          disabled={addingFloor}
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm Tầng Mới
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* ── ADD NEW FLOOR FORM ── */}
        {addingFloor && (
          <div className="bg-white border-2 border-black/10 border-dashed rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800">Thêm Tầng Mới</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase font-semibold">Tên tầng <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="VD: Tầng B2"
                  value={newFloorForm.floor_name}
                  onChange={e => setNewFloorForm(p => ({ ...p, floor_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase font-semibold">Số thứ tự tầng</Label>
                <Input
                  type="number" min={1}
                  value={newFloorForm.floor_number}
                  onChange={e => setNewFloorForm(p => ({ ...p, floor_number: Number(e.target.value) }))}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase font-semibold">Mô tả (tuỳ chọn)</Label>
                <Input
                  placeholder="VD: Tầng hầm dưới lòng đất"
                  value={newFloorForm.description}
                  onChange={e => setNewFloorForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button variant="ghost" onClick={() => setAddingFloor(false)}>Huỷ</Button>
              <Button
                onClick={() => createFloorMut.mutate()}
                disabled={createFloorMut.isPending || !newFloorForm.floor_name.trim()}
                className="bg-black hover:bg-slate-800 text-white font-semibold"
              >
                {createFloorMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Lưu Tầng
              </Button>
            </div>
          </div>
        )}

        {/* ── FLOORS LIST ── */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : floors.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có tầng nào. Hãy thêm tầng đầu tiên!</p>
          </div>
        ) : floors.map((floor: any) => {
          const isExpanded = expandedFloor === floor.id;
          const zones: any[] = floor.parkingZone ?? [];

          return (
            <div key={floor.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">

              {/* Floor Header */}
              <div
                className={cn(
                  "flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors",
                  isExpanded && "bg-slate-50"
                )}
                onClick={() => setExpandedFloor(isExpanded ? null : floor.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border flex items-center justify-center font-bold text-slate-700 text-sm">
                    {floor.floor_number}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{floor.floor_name}</p>
                    <p className="text-xs text-slate-400">{zones.length} khu vực · {zones.reduce((a: number, z: any) => a + (z.total_slots || 0), 0)} chỗ đỗ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { startEditFloor(floor); setExpandedFloor(floor.id); }}
                    className="text-xs h-8 hover:bg-slate-100"
                  >
                    <Edit2 className="w-3 h-3 mr-1.5" /> Sửa tầng
                  </Button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    onClick={() => setExpandedFloor(isExpanded ? null : floor.id)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Edit Floor Inline */}
              {editingFloor === floor.id && isExpanded && (
                <div className="px-5 pb-4 pt-2 bg-amber-50/60 border-t border-amber-100 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-semibold text-amber-700 uppercase mb-3">Chỉnh sửa thông tin tầng</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">Tên tầng</Label>
                      <Input value={floorForm.floor_name as string}
                        onChange={e => setFloorForm(p => ({ ...p, floor_name: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">Mô tả</Label>
                      <Input value={floorForm.description as string}
                        onChange={e => setFloorForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingFloor(null)}>Huỷ</Button>
                    <Button size="sm" disabled={updateFloorMut.isPending}
                      onClick={() => updateFloorMut.mutate({ id: floor.id, ...floorForm } as any)}
                      className="bg-black hover:bg-slate-800 text-white">
                      {updateFloorMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                      Lưu
                    </Button>
                  </div>
                </div>
              )}

              {/* Zones */}
              {isExpanded && (
                <div className="border-t divide-y bg-slate-50/50">

                  {zones.map((zone: any) => (
                    <div key={zone.id} className="px-5 py-4">
                      {editingZone === zone.id ? (
                        /* ── Edit Zone Form ── */
                        <div className="animate-in slide-in-from-top-1 duration-200">
                          <p className="text-xs font-semibold text-blue-700 uppercase mb-3 flex items-center gap-1.5">
                            <Edit2 className="w-3 h-3" /> Chỉnh sửa khu vực
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500">Tên khu vực</Label>
                              <Input value={zoneForm.zone_name as string}
                                onChange={e => setZoneForm(p => ({ ...p, zone_name: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500">Mô tả</Label>
                              <Input value={zoneForm.description as string}
                                onChange={e => setZoneForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500">Số chỗ đỗ</Label>
                              <Input type="number" value={zoneForm.total_slots as number}
                                onChange={e => setZoneForm(p => ({ ...p, total_slots: Number(e.target.value) }))} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-green-50/80 rounded-xl border border-green-100">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Giá / giờ (VNĐ)
                              </Label>
                              <Input type="number" value={zoneForm.priceHour as number}
                                onChange={e => setZoneForm(p => ({ ...p, priceHour: Number(e.target.value) }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Giá / ngày (VNĐ)
                              </Label>
                              <Input type="number" value={zoneForm.priceDay as number}
                                onChange={e => setZoneForm(p => ({ ...p, priceDay: Number(e.target.value) }))} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setEditingZone(null)}>Huỷ</Button>
                            <Button size="sm" disabled={updateZoneMut.isPending}
                              onClick={() => updateZoneMut.mutate(zoneForm)}
                              className="bg-black hover:bg-slate-800 text-white">
                              {updateZoneMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                              Lưu thay đổi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── Zone Display ── */
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{zone.zone_name}
                                <span className="ml-2 text-xs bg-slate-100 border rounded px-1.5 py-0.5 font-mono text-slate-500">{zone.total_slots} slots</span>
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{zone.description}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm"
                            onClick={() => startEditZone(floor.id, zone)}
                            className="text-xs h-8 bg-white hover:bg-slate-50">
                            <Edit2 className="w-3 h-3 mr-1.5" /> Cập nhật
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ── Add New Zone Form ── */}
                  {addingZone === floor.id ? (
                    <div className="px-5 py-5 bg-blue-50/60 border-t border-blue-100 animate-in slide-in-from-bottom-2 duration-300">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-3 flex items-center gap-1.5">
                        <Plus className="w-3 h-3" /> Thêm khu vực mới cho {floor.floor_name}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Tên khu vực <span className="text-red-400">*</span></Label>
                          <Input placeholder="VD: Khu B Premium"
                            value={newZoneForm.zone_name}
                            onChange={e => setNewZoneForm(p => ({ ...p, zone_name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Tiền tố ký hiệu ô đỗ</Label>
                          <Input placeholder="VD: B" maxLength={3} className="uppercase font-mono"
                            value={newZoneForm.prefix}
                            onChange={e => setNewZoneForm(p => ({ ...p, prefix: e.target.value.toUpperCase() }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Số chỗ đỗ</Label>
                          <Input type="number" min={1}
                            value={newZoneForm.total_slots}
                            onChange={e => setNewZoneForm(p => ({ ...p, total_slots: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Mô tả (tuỳ chọn)</Label>
                          <Input placeholder="Ghi chú thêm"
                            value={newZoneForm.description}
                            onChange={e => setNewZoneForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-green-50/80 rounded-xl border border-green-100">
                        <div className="col-span-2">
                          <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
                            <DollarSign className="w-3 h-3" /> Thiết lập giá ban đầu
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Giá / giờ (VNĐ)</Label>
                          <Input type="number" value={newZoneForm.priceHour}
                            onChange={e => setNewZoneForm(p => ({ ...p, priceHour: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Giá / ngày (VNĐ)</Label>
                          <Input type="number" value={newZoneForm.priceDay}
                            onChange={e => setNewZoneForm(p => ({ ...p, priceDay: Number(e.target.value) }))} />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setAddingZone(null)}>Huỷ</Button>
                        <Button size="sm"
                          disabled={createZoneMut.isPending || !newZoneForm.zone_name.trim()}
                          onClick={() => createZoneMut.mutate(floor.id)}
                          className="bg-black hover:bg-slate-800 text-white font-semibold">
                          {createZoneMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                          Thêm Khu vực & Lưu Giá
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-3 flex justify-center">
                      <Button
                        variant="ghost" size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold border border-dashed border-blue-200 w-full rounded-xl"
                        onClick={() => { setAddingZone(floor.id); setEditingZone(null); }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm khu vực mới vào {floor.floor_name}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
