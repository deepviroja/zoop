import { useEffect, useState } from 'react';
import { X } from '../../assets/icons/X';
import { Upload } from '../../assets/icons/Upload';
import { API_BASE_URL } from '../../config/apiBase';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';

interface Props {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  initialUrls?: string[];
}

export const ImageUpload: React.FC<Props> = ({ onUpload, maxFiles = 12, initialUrls = [] }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrls.length > 0) {
      setUploadedUrls(initialUrls);
      return;
    }
    setUploadedUrls([]);
  }, [initialUrls]);

  const isVideoUrl = (url: string) =>
    /(\.mp4|\.webm|\.mov|\.ogg|\.m4v)(\?|$)/i.test(url) || url.includes('/video/upload/');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedUrls.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} media files`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        const file = files[i];
        const isVideo = (file.type || '').startsWith('video/');
        formData.append(isVideo ? 'video' : 'image', file);
        
        const apiUrl = API_BASE_URL;
        const token = localStorage.getItem('authToken');
        
        const endpoint = isVideo ? '/upload/video' : '/upload';
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          body: formData,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        newUrls.push(optimizeCloudinaryUrl(data.url));
      }

      const allUrls = [...uploadedUrls, ...newUrls];
      setUploadedUrls(allUrls);
      onUpload(allUrls);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(newUrls);
    onUpload(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-6 py-3 bg-zoop-moss text-zoop-obsidian rounded-xl font-bold cursor-pointer hover:bg-zoop-obsidian hover:text-white transition-all">
          <Upload width={20} height={20} />
          {uploading ? 'Uploading...' : 'Add Media'}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading || uploadedUrls.length >= maxFiles}
            className="hidden"
          />
        </label>
        <span className="text-sm text-gray-500">
          {uploadedUrls.length}/{maxFiles} files
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl font-bold">
          {error}
        </div>
      )}

      {/* Media Preview */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {uploadedUrls.map((url, index) => (
            <div key={index} className="relative group">
              {isVideoUrl(url) ? (
                <video
                  src={optimizeCloudinaryUrl(url)}
                  controls
                  className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 bg-black"
                />
              ) : (
                <img
                  src={optimizeCloudinaryUrl(url, { width: 400 })}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X width={16} height={16} />
              </button>
              {index === 0 && !isVideoUrl(url) && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-zoop-moss text-zoop-obsidian text-xs font-black rounded">
                  Thumbnail
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
