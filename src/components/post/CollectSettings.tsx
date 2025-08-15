"use client";

import { format } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

export interface CollectConfig {
  enabled: boolean;
  collectLimit?: number;
  endsAt?: string;
  followersOnly?: boolean;
  price?: {
    amount: string;
    currency: "GHO" | "WGHO";
  };
}

interface CollectSettingsProps {
  config: CollectConfig;
  onChange: (config: CollectConfig) => void;
}

export function CollectSettings({ config, onChange }: CollectSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPrice, setLocalPrice] = useState(config.price?.amount || "");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    config.endsAt ? new Date(config.endsAt) : undefined
  );

  const handleToggle = (enabled: boolean) => {
    onChange({ ...config, enabled });
    if (!enabled) {
      setIsOpen(false);
    }
  };

  const handleLimitChange = (value: string) => {
    const limit = value ? parseInt(value, 10) : undefined;
    onChange({ ...config, collectLimit: limit });
  };

  const handlePriceChange = (amount: string) => {
    setLocalPrice(amount);
    if (!amount) {
      const { price: _, ...rest } = config;
      onChange(rest);
    } else {
      onChange({
        ...config,
        price: {
          amount,
          currency: config.price?.currency || "GHO",
        },
      });
    }
  };

  // Currency is fixed to GHO in UI; keep config currency as GHO when price is set

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onChange({
      ...config,
      endsAt: date ? date.toISOString() : undefined,
    });
    setDatePickerOpen(false);
  };

  const handleFollowersOnlyChange = (checked: boolean) => {
    onChange({
      ...config,
      followersOnly: checked,
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`rounded-full w-8 h-8 hover:bg-transparent button-hover-bg button-hover-bg-equal`}
        onClick={() => {
          if (!config.enabled) {
            handleToggle(true);
          }
          setIsOpen(true);
        }}
      >
        <ShoppingBag strokeWidth={2.0} className={`h-[19px] w-[19px] text-muted-foreground`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Settings</DialogTitle>
            <DialogDescription>
              Configure how others can collect your post
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Collect limits</Label>
              {/* <Label htmlFor="collect-limit" className="text-sm">
                Amount of collects
              </Label> */}
              <Input
                id="collect-limit"
                type="number"
                placeholder="Unlimited"
                value={config.collectLimit || ""}
                onChange={(e) => handleLimitChange(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                min="1"
              />
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="followers-only"
                  checked={config.followersOnly || false}
                  onCheckedChange={handleFollowersOnlyChange}
                />
                <Label htmlFor="followers-only" className="text-sm cursor-pointer">
                  Followers only
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collect-price" className="text-sm">
                Price
              </Label>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/60">$</span>
                  <Input
                    id="collect-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="Free"
                    value={localPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handlePriceChange(value);
                      }
                    }}
                    className="pl-8"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Set a price to collect (1.5% protocol fee applies)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collect-end" className="text-sm">
                End Date
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="collect-end"
                    className="w-full justify-between"
                  >
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    {datePickerOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full" side="top" align="start">
                  <Calendar
                    className="w-full"
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Followers only moved into Collect limits section */}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="w-full rounded-2xl mt-4"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}