"use client";

import { CalendarIcon, CoinsIcon, InfinityIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
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
    currency: "MATIC" | "USDC";
  };
}

interface CollectSettingsProps {
  config: CollectConfig;
  onChange: (config: CollectConfig) => void;
}

export function CollectSettings({ config, onChange }: CollectSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    if (!amount) {
      const { price: _, ...rest } = config;
      onChange(rest);
    } else {
      onChange({
        ...config,
        price: {
          amount,
          currency: config.price?.currency || "MATIC",
        },
      });
    }
  };

  const handleCurrencyChange = (currency: "MATIC" | "USDC") => {
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

  const handleEndDateChange = (value: string) => {
    onChange({
      ...config,
      endsAt: value || undefined,
    });
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Collect Settings</h4>
                <p className="text-xs text-muted-foreground">
                  Configure how others can collect your post as an NFT
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="collect-limit" className="text-xs flex items-center gap-1">
                    <InfinityIcon className="w-3 h-3" />
                    Collect Limit
                  </Label>
                  <Input
                    id="collect-limit"
                    type="number"
                    placeholder="Unlimited"
                    value={config.collectLimit || ""}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    min="1"
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited collects
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collect-price" className="text-xs flex items-center gap-1">
                    <CoinsIcon className="w-3 h-3" />
                    Price
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="collect-price"
                      type="number"
                      placeholder="Free"
                      value={config.price?.amount || ""}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      min="0"
                      step="0.01"
                      className="h-8 text-sm flex-1"
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
                          <SelectItem value="MATIC">MATIC</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set a price to collect (1.5% protocol fee applies)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collect-end" className="text-xs flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    End Date
                  </Label>
                  <Input
                    id="collect-end"
                    type="datetime-local"
                    value={config.endsAt || ""}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="h-8 text-sm"
                  />
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
                    className="text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <UsersIcon className="w-3 h-3" />
                    Followers only
                  </Label>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs"
                  onClick={() => setIsOpen(false)}
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