
import { Wrench, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";

interface SuggestedActionsProps {
  onActionClick: (action: string) => void;
}

const SuggestedActions = ({ onActionClick }: SuggestedActionsProps) => {
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        className="w-full justify-start"
        onClick={() => onActionClick("maintenance")}
      >
        <Wrench className="mr-2 h-4 w-4" />
        Report a Maintenance Issue
      </Button>
      
      <Button
        variant="secondary"
        className="w-full justify-start"
        onClick={() => onActionClick("rent")}
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        Check Rent Status
      </Button>
    </div>
  );
};

export default SuggestedActions;
