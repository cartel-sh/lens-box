"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";

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

  const handleCurrencyChange = (currency: "GHO" | "WGHO") => {
    if (config.price) {
      onChange({
        ...config,
        price: {
          ...config.price,
          currency,
        },
      });
    }
  };

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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Switch
          id="collect-toggle"
          checked={config.enabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="collect-toggle" className="text-sm cursor-pointer">
          Collectible
        </Label>
      </div>

      {config.enabled && (
        <Popover open={isOpen} onOpenChange={(open) => {
          // Only allow closing via the Done button or escape key
          if (!open && isOpen) {
            // Don't close if we're just interacting with inputs
            return;
          }
          setIsOpen(open);
        }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80" 
            align="end" 
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={() => setIsOpen(false)}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Collect Settings</h4>
                <p className="text-xs text-muted-foreground">
                  Configure how others can collect your post as an NFT
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="collect-limit" className="text-xs">
                    Collect Limit
                  </Label>
                  <Input
                    id="collect-limit"
                    type="number"
                    placeholder="Unlimited"
                    value={config.collectLimit || ""}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    min="1"
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited collects
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collect-price" className="text-xs">
                    Price
                  </Label>
                  <div className="flex gap-2">
                    <input
                      id="collect-price"
                      type="text"
                      inputMode="decimal"
                      placeholder="Free"
                      value={localPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only numbers and decimal point
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          handlePriceChange(value);
                        }
                      }}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                    />
                    {config.price && (
                      <Select
                        value={config.price.currency}
                        onValueChange={handleCurrencyChange}
                      >
                        <SelectTrigger className="h-8 w-20 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHO">GHO</SelectItem>
                          <SelectItem value="WGHO">WGHO</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set a price to collect (1.5% protocol fee applies)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collect-end" className="text-xs">
                    End Date
                  </Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="collect-end"
                        className="w-full h-8 justify-between font-normal text-sm"
                      >
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Optional deadline for collecting
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="followers-only"
                    checked={config.followersOnly || false}
                    onCheckedChange={handleFollowersOnlyChange}
                  />
                  <Label
                    htmlFor="followers-only"
                    className="text-xs cursor-pointer"
                  >
                    Followers only
                  </Label>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}