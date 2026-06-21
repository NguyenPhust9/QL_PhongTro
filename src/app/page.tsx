import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, LogIn, Building2 } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Image
        src="/anhnentro.jpg"
        alt="Ảnh nền phòng trọ"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card giữa màn hình */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl">

          {/* Icon + Tiêu đề */}
          <div className="mb-6 flex flex-col items-center gap-3">
           
            <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
              Quản lý phòng trọ
            </h1>
            <p className="text-center text-sm text-slate-500">
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
                className="h-12 w-full rounded-xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-700 transition-colors duration-300"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Đăng nhập
              </Button>
            </Link>

            <Link href="/xem-phong" className="w-full">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-base font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-300"
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
  );
}