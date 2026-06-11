import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
            backgroundImage: "url('/phongtrobg.jpg')",
      }}
    >
      <div className="flex min-h-screen items-center justify-center bg-black/45 px-4">
        <div className="max-w-3xl text-center text-white">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl lg:text-4xl">
            Hệ thống quản lý phòng trọ
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/90 md:text-lg lg:text-xl">
            Hệ thống quản lý phòng trọ hiện đại và tiện lợi
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/dang-nhap" className="w-full sm:w-auto">
             <Button
            size="lg"
            className="h-12 w-full rounded-xl px-8 text-base font-semibold sm:w-auto bg-white text-black hover:bg-black hover:text-white transition-colors duration-300"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Đăng nhập
          </Button>
            </Link>

            <Link href="/xem-phong" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl border-white bg-white/10 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white hover:text-slate-900 sm:w-auto"
              >
                <HomeIcon className="mr-2 h-5 w-5" />
                Xem phòng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}