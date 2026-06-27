import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Home as HomeIcon, LogIn, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/anhnentro.jpg"
        alt="Ảnh nền phòng trọ"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Card giữa màn hình */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[0.95fr_1.05fr]">
          {/* Hình bên trái */}
          <div className="relative hidden min-h-[460px] overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black md:block">
            <div className="absolute -left-24 -top-24 size-72 rounded-full bg-amber-400/25 blur-3xl" />
            <div className="absolute -bottom-28 -right-28 size-72 rounded-full bg-yellow-600/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_35%)]" />

            <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
              {/* Logo lớn, không bị mờ */}
              <Image
                src="/logo_oria.png"
                alt="Oria Homes"
                width={1024}
                height={1024}
                quality={100}
                priority
                sizes="(min-width: 768px) 320px, 180px"
                className="h-auto w-72 max-w-full object-contain drop-shadow-[0_0_35px_rgba(245,158,11,0.45)]"
              />

              <div className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-amber-100/80">
                <Sparkles className="size-4 text-amber-400" />
                Nơi nghệ thuật kiến tạo tổ ấm
              </div>
            </div>
          </div>

          {/* Nội dung bên phải */}
          <div className="p-8 sm:p-10">
            {/* Logo mobile */}
            <div className="mb-8 flex justify-center md:hidden">
              <Image
                src="/oria_homes_full_1024.png"
                alt="Oria Homes"
                width={1024}
                height={1024}
                quality={100}
                priority
                sizes="180px"
                className="h-auto w-40 object-contain drop-shadow-[0_0_22px_rgba(245,158,11,0.35)]"
              />
            </div>

            {/* Tiêu đề */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                Quản lý phòng trọ
              </h1>
              <p className="text-center text-sm leading-6 text-slate-500">
                Hệ thống quản lý phòng trọ hiện đại và tiện lợi
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-slate-100" />

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Link href="/dang-nhap" className="w-full">
                <Button
                  size="lg"
                  className="h-12 w-full rounded-xl bg-slate-900 text-base font-semibold text-white transition-colors duration-300 hover:bg-slate-700"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Đăng nhập
                </Button>
              </Link>

              <Link href="/xem-phong" className="w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-base font-semibold text-slate-700 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900"
                >
                  <HomeIcon className="mr-2 h-5 w-5" />
                  Xem phòng
                </Button>
              </Link>
            </div>

            {/* Footer nhỏ */}
            <p className="mt-6 text-center text-xs text-slate-400">
              © 2026 Hệ thống quản lý phòng trọ
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}