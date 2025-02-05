import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');

      let filename = 'member-registration.docx';
      if (contentDisposition) {
        // Try UTF-8 filename first
        const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8FilenameMatch) {
          filename = decodeURIComponent(utf8FilenameMatch[1]);
        } else {
          // Fall back to regular filename
          const regularFilenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (regularFilenameMatch) {
            filename = regularFilenameMatch[1];
          }
        }
      }
      console.log('Extracted filename:', filename);

      // Convert response to blob and download
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
        message: `Failed to generate document. Please try again. ${error}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
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
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Generating Document...' : 'Generate Document'}
          </button>

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
  );
};

export default MemberRegistrationForm;