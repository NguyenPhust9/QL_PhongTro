'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Video as VideoIcon, Loader2, Film } from 'lucide-react';
import { toast } from 'sonner';

interface PhongVideoUploadProps {
  videos: string[];
  onVideosChange: (videos: string[]) => void;
  className?: string;
  maxVideos?: number;
  maxSizeMB?: number;
}

export function PhongVideoUpload({
  videos,
  onVideosChange,
  className = '',
  maxVideos = 3,
  maxSizeMB = 100,
}: PhongVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);

    // Kiểm tra số lượng video
    if (videos.length + newFiles.length > maxVideos) {
      toast.error(`Chỉ được upload tối đa ${maxVideos} video`);
      return;
    }

    // Kiểm tra định dạng file
    const invalidTypeFiles = newFiles.filter((file) => !file.type.startsWith('video/'));
    if (invalidTypeFiles.length > 0) {
      toast.error('Vui lòng chọn file video hợp lệ');
      return;
    }

    // Kiểm tra dung lượng file
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = newFiles.filter((file) => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      toast.error(`Mỗi video không được vượt quá ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Lỗi upload video');
        }

        const result = await response.json();
        return result.data.secure_url || result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onVideosChange([...videos, ...uploadedUrls]);

      toast.success(`Upload ${uploadedUrls.length} video thành công!`);
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload video');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);
    onVideosChange(newVideos);
    toast.success('Xóa video thành công!');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Film className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium">Video phòng</h3>
        <Badge variant="secondary" className="text-xs">
          {videos.length}/{maxVideos} video
        </Badge>
      </div>

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || videos.length >= maxVideos}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || videos.length >= maxVideos}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Thêm video
            </>
          )}
        </Button>
        {videos.length >= maxVideos ? (
          <span className="text-sm text-gray-500">
            Đã đạt giới hạn {maxVideos} video
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            Tối đa {maxSizeMB}MB/video
          </span>
        )}
      </div>

      {/* Videos grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((videoUrl, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100">
                  <video
                    src={videoUrl}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeVideo(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <VideoIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm text-center">
              Chưa có video phòng nào
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Click &quot;Thêm video&quot; để upload video giới thiệu phòng
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status badge */}
      <div className="flex justify-center">
        <Badge variant={videos.length > 0 ? 'default' : 'secondary'} className="text-xs">
          {videos.length > 0 ? `Đã upload ${videos.length} video phòng` : 'Chưa có video phòng'}
        </Badge>
      </div>
    </div>
  );
}
