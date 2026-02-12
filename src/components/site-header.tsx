"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const parkingLots = [
  { id: "1", name: "GoPark Station 1" },
  { id: "2", name: "GoPark Station 2" },
  { id: "3", name: "GoPark Central" },
];

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Select defaultValue={parkingLots[0].id}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select parking lot" />
            </SelectTrigger>
            <SelectContent>
              {parkingLots.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total parking lots:</span>
          <span className="font-medium text-foreground">
            {parkingLots.length}
          </span>
        </div>
      </div>
    </header>
  );
}
