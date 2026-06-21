'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  matKhau: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email: data.email,
        matKhau: data.matKhau,
        redirect: false,
      });
      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-5xl min-h-[700px] overflow-hidden rounded-3xl shadow-2xl">

        {/* Bên trái - Ảnh */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block relative"
        >
          <img
            src="/images/login-banner.jfif"
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>

        {/* Bên phải - Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white flex items-center justify-center p-8 md:p-12"
        >
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-zinc-900 mb-2">Chào mừng</h2>
              <p className="text-sm text-zinc-500">Đăng nhập để tiếp tục</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-sm bg-red-50 text-red-700 rounded-xl px-4 py-3 border border-red-200/50"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('matKhau')}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.matKhau && <p className="mt-1.5 text-xs text-red-600">{errors.matKhau.message}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 0.99 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-rose-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</> : 'Đăng nhập'}
              </motion.button>
            </form>

            <p className="text-center text-xs text-zinc-500 mt-6">
              Chưa có tài khoản?{' '}
              <Link href="/dang-ky" className="text-orange-600 font-semibold hover:text-orange-700">
                Đăng ký ngay
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-zinc-100">
              <Link
                href="/dang-nhap"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-all"
              >
                🏠 Đăng nhập với tư cách khách thuê
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}