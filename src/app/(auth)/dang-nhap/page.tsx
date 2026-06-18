'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Key } from 'lucide-react';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-zinc-950 dark:to-rose-950/30 flex items-center justify-center px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 w-full max-w-5xl items-center">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-col justify-center px-12"
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  Phòng Trọ
                </h1>
              </div>

              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Quản lý cho thuê phòng
              </p>
            </div>

            <div className="space-y-4 pt-8">
              {[
                { label: 'Tìm phòng đẹp', icon: '🏠' },
                { label: 'Quản lý dễ dàng', icon: '📋' },
                { label: 'Liên lạc nhanh', icon: '💬' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + idx * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="pt-8 text-xs text-zinc-500 dark:text-zinc-400">
              Nền tảng tiện lợi cho chủ trọ và người tìm trọ
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:pl-12"
        >
          <div className="bg-white dark:bg-zinc-900/80 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8 md:p-10 border border-orange-100/50 dark:border-orange-900/20 backdrop-blur-sm">

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                Chào mừng
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Đăng nhập để tiếp tục tìm kiếm phòng trọ
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-sm bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 border border-red-200/50 dark:border-red-900/30"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Mật khẩu
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('matKhau')}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {errors.matKhau && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {errors.matKhau.message}
                  </p>
                )}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 0.99 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-rose-500/30 hover:from-orange-600 hover:to-rose-600 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </motion.button>
            </form>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
              Chưa có tài khoản?{' '}
              <Link
                href="/dang-ky"
                className="text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Link
                href="/khach-thue/dang-nhap"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
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