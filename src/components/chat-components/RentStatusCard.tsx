import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, CreditCard, History } from "lucide-react";

interface RentStatusCardProps {
  amountDue: number;
  dueDate: string;
  status: string;
  amountPaid?: number;
  lateFeesAmount?: number;
}

const RentStatusCard = ({ 
  amountDue, 
  dueDate, 
  status, 
  amountPaid = 0,
  lateFeesAmount = 0 
}: RentStatusCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500 text-white">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const remainingBalance = amountDue - amountPaid + lateFeesAmount;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5" />
          Rent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(remainingBalance)}
          </div>
          <div className="text-sm text-muted-foreground">
            {remainingBalance > 0 ? "Amount Due" : "Paid in Full"}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Due on {formatDate(dueDate)}</span>
        </div>

        <div className="flex justify-center">
          {getStatusBadge()}
        </div>

        {amountPaid > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Paid: {formatCurrency(amountPaid)}
            {lateFeesAmount > 0 && (
              <div className="text-red-600">
                Late Fees: {formatCurrency(lateFeesAmount)}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {remainingBalance > 0 && (
            <Button className="w-full" size="lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
          )}
          
          <Button variant="link" className="w-full" size="sm">
            <History className="w-4 h-4 mr-2" />
            View Payment History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentStatusCard;