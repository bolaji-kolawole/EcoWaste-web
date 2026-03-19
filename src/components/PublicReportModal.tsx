import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface PublicReportModalProps {
  onClose: () => void;
}

export default function PublicReportModal({ onClose }: PublicReportModalProps) {
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!location || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // In a real app, this would submit to the server
    toast.success('Report submitted successfully! Authorities will be notified.');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-yellow-600" />
            Report Illegal Dumping
          </DialogTitle>
          <DialogDescription>
            Help keep Lagos clean by reporting illegal waste dumping in your area
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="Enter the location of illegal dumping"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Photos (Optional, max 5)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="report-image-upload"
              />
              <label
                htmlFor="report-image-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="size-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload images
                </span>
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your report will be sent to Lagos State Environmental Protection Agency
              for immediate action. Please provide accurate information.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-yellow-600 hover:bg-yellow-700">
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
