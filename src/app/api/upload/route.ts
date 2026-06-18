import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'Không có file được chọn' },
        { status: 400 }
      );
    }

  // Kiểm tra loại file: chấp nhận cả ảnh và video
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { message: 'Chỉ được upload file ảnh hoặc video' },
        { status: 400 }
      );
    }

    // Kiểm tra kích thước file: ảnh tối đa 10MB, video tối đa 100MB
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: `Kích thước file không được vượt quá ${isVideo ? 100 : 10}MB` },
        { status: 400 }
      );
    }

    // Upload lên Cloudinary - dùng resource_type tương ứng với loại file
    const resourceType = isVideo ? 'video' : 'image';
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_UPLOAD_PRESET || 'ml_default');

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUD_NAME || 'duv9pccwi'}/${resourceType}/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      throw new Error('Lỗi khi upload lên Cloudinary');
    }

    const cloudinaryResult = await cloudinaryResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,  // thêm dòng này

        secure_url: cloudinaryResult.secure_url,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      },
      message: 'Upload ảnh thành công',
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi upload file' },
      { status: 500 }
    );
  }
}