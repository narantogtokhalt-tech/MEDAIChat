import Image from "next/image";

export default function User() {
  return (
    <div className="flex h-16 items-center border-b border-border px-2">
      {/* Лого бүрэн харагдах блок */}
      <div className="relative h-10 w-40">
        <Image
          src="/avatar.png"
          alt="Эдийн засаг, хөгжлийн яам"
          fill           // div-ийг бүхэлд нь дүүргэнэ
          className="object-contain" // эсвэл object-cover гэж сольж болно
          priority
        />
      </div>
    </div>
  );
}