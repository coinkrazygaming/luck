import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Loader2, Save, CreditCard, Building2, DollarSign } from "lucide-react";

interface BankInfo {
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  bankAddress: string;
  swiftCode: string;
  ibanCode: string;
  accountType: string;
  currency: string;
  minDeposit: number;
  maxDeposit: number;
  processingTime: string;
  fees: number;
  notes: string;
}

interface AdminCasinoBankProps {
  token: string;
}

export function AdminCasinoBank({ token }: AdminCasinoBankProps) {
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    accountHolder: "CoinKrazy Casino",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
    bankAddress: "",
    swiftCode: "",
    ibanCode: "",
    accountType: "Business",
    currency: "USD",
    minDeposit: 10,
    maxDeposit: 10000,
    processingTime: "1-3 business days",
    fees: 2.5,
    notes: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBankInfo();
  }, []);

  const loadBankInfo = async () => {
    try {
      const response = await fetch("/api/admin/casino/bank", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBankInfo(data);
      }
    } catch (error) {
      console.error("Error loading bank info:", error);
    }
  };

  const saveBankInfo = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/casino/bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankInfo),
      });

      if (!response.ok) throw new Error("Failed to save bank info");
      toast.success("Bank information saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save bank info");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Account Information
          </CardTitle>
          <CardDescription>
            Configure casino bank details for player deposits and withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                value={bankInfo.accountHolder}
                onChange={(e) =>
                  setBankInfo({ ...bankInfo, accountHolder: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <select
                id="accountType"
                value={bankInfo.accountType}
                onChange={(e) =>
                  setBankInfo({ ...bankInfo, accountType: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="Business">Business</option>
                <option value="Personal">Personal</option>
                <option value="Trust">Trust</option>
              </select>
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankInfo.bankName}
                onChange={(e) =>
                  setBankInfo({ ...bankInfo, bankName: e.target.value })
                }
                placeholder="e.g., Chase Bank"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={bankInfo.currency}
                onChange={(e) =>
                  setBankInfo({ ...bankInfo, currency: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="CAD">CAD (Canadian Dollar)</option>
                <option value="AUD">AUD (Australian Dollar)</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={bankInfo.accountNumber}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      accountNumber: e.target.value,
                    })
                  }
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={bankInfo.routingNumber}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      routingNumber: e.target.value,
                    })
                  }
                  placeholder="Enter routing number"
                />
              </div>
              <div>
                <Label htmlFor="swiftCode">SWIFT Code</Label>
                <Input
                  id="swiftCode"
                  value={bankInfo.swiftCode}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, swiftCode: e.target.value })
                  }
                  placeholder="e.g., CHASUS33"
                />
              </div>
              <div>
                <Label htmlFor="ibanCode">IBAN Code</Label>
                <Input
                  id="ibanCode"
                  value={bankInfo.ibanCode}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, ibanCode: e.target.value })
                  }
                  placeholder="Enter IBAN"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Textarea
                id="bankAddress"
                value={bankInfo.bankAddress}
                onChange={(e) =>
                  setBankInfo({ ...bankInfo, bankAddress: e.target.value })
                }
                placeholder="Full bank address"
                rows={2}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Deposit Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minDeposit">Minimum Deposit ($)</Label>
                <Input
                  id="minDeposit"
                  type="number"
                  step="0.01"
                  value={bankInfo.minDeposit}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      minDeposit: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxDeposit">Maximum Deposit ($)</Label>
                <Input
                  id="maxDeposit"
                  type="number"
                  step="0.01"
                  value={bankInfo.maxDeposit}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      maxDeposit: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="processingTime">Processing Time</Label>
                <Input
                  id="processingTime"
                  value={bankInfo.processingTime}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      processingTime: e.target.value,
                    })
                  }
                  placeholder="e.g., 1-3 business days"
                />
              </div>
              <div>
                <Label htmlFor="fees">Transaction Fee (%)</Label>
                <Input
                  id="fees"
                  type="number"
                  step="0.01"
                  value={bankInfo.fees}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      fees: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={bankInfo.notes}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, notes: e.target.value })
              }
              placeholder="Any additional information for users..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveBankInfo}
              disabled={isSaving}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Bank Information
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Account Holder</span>
            <span className="font-medium">{bankInfo.accountHolder}</span>
          </div>
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Bank Name</span>
            <span className="font-medium">{bankInfo.bankName || "Not set"}</span>
          </div>
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Account Type</span>
            <Badge>{bankInfo.accountType}</Badge>
          </div>
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Currency</span>
            <Badge variant="outline">{bankInfo.currency}</Badge>
          </div>
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Deposit Range</span>
            <span className="font-medium">
              ${bankInfo.minDeposit.toFixed(2)} - ${bankInfo.maxDeposit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Transaction Fee</span>
            <span className="font-medium">{bankInfo.fees}%</span>
          </div>
          <div className="flex justify-between p-3 bg-secondary rounded-lg">
            <span>Processing Time</span>
            <span className="font-medium">{bankInfo.processingTime}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
