import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface FormData {
  name: string;
  idCardNumber: string;
  email: string;
  phone: string;
  address: string;
}

const MemberRegistrationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    idCardNumber: '',
    email: '',
    phone: '',
    address: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const updatePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('http://localhost:3000/api/preview-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate preview');

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);

      // Clean up old preview URL if it exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview error:', error);
      setStatus({
        type: 'error',
        message: 'Failed to generate preview'
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup preview URL when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost:3000/api/generate-docx', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'member-registration.docx';

      if (contentDisposition) {
        const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8FilenameMatch) {
          filename = decodeURIComponent(utf8FilenameMatch[1]);
        } else {
          const regularFilenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (regularFilenameMatch) {
            filename = regularFilenameMatch[1];
          }
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus({
        type: 'success',
        message: 'Document generated and downloaded successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to generate document: ${error}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-4 p-4 max-w-[1600px] mx-auto">
      {/* Form Section */}
      <div className="w-1/2">
        <Card>
          <CardHeader>
            <CardTitle>New Member Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
              spellCheck="false"
              data-form-type="other"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  autoSave="off"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">ID Card Number</label>
                <input
                  type="text"
                  name="idCardNumber"
                  value={formData.idCardNumber}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  autoSave="off"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  autoSave="off"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  autoSave="off"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  autoSave="off"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Generating Document...' : 'Download Document'}
                </Button>

                <Button
                  type="button"
                  onClick={updatePreview}
                  disabled={isLoadingPreview}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                  Refresh Preview
                </Button>
              </div>

              {status.type && (
                <Alert variant={status.type === 'success' ? 'default' : 'destructive'}>
                  <AlertDescription>
                    {status.message}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="w-1/2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            {previewUrl ? (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <div className="h-full">
                  <Viewer
                    fileUrl={previewUrl}
                  />
                </div>
              </Worker>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Click "Refresh Preview" to see the document preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberRegistrationForm;