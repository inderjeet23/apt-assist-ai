import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface MaintenanceFormData {
  description: string;
  priority: string;
  files: FileList | null;
  permissionGranted: boolean;
}

interface MaintenanceRequestFormProps {
  onSubmit: (data: MaintenanceFormData) => void;
}

const MaintenanceRequestForm = ({ onSubmit }: MaintenanceRequestFormProps) => {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [files, setFiles] = useState<FileList | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      priority,
      files,
      permissionGranted
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Maintenance Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Describe the issue</Label>
            <Textarea
              id="description"
              placeholder="Please describe what needs to be fixed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Priority Level</Label>
            <ToggleGroup 
              type="single" 
              value={priority} 
              onValueChange={(value) => value && setPriority(value)}
              className="justify-start"
            >
              <ToggleGroupItem value="low" aria-label="Low priority">
                Low
              </ToggleGroupItem>
              <ToggleGroupItem value="medium" aria-label="Medium priority">
                Medium
              </ToggleGroupItem>
              <ToggleGroupItem value="high" aria-label="High priority">
                High
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload Photo/Video (Optional)</Label>
            <div className="relative">
              <Input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {files && files.length > 0 
                  ? `${files.length} file(s) selected` 
                  : "Upload Photo/Video"
                }
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="permission"
              checked={permissionGranted}
              onCheckedChange={(checked) => setPermissionGranted(checked === true)}
            />
            <Label htmlFor="permission" className="text-sm">
              I grant permission to enter the unit for repairs
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={!description.trim()}>
            Submit Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MaintenanceRequestForm;