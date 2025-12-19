"use client";

import Container from "../container";
import { ThemeToggle } from "../theme-toggle";
import SessionMenu from "@/components/SessionMenu";

type Props = {
  title: string;
};

export default function TopNav({ title }: Props) {
  return (
    <Container className="flex h-16 items-center justify-between border-b border-border">
      {/* Left */}
      <h1 className="text-2xl font-medium">{title}</h1>

      {/* Right */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <SessionMenu />
      </div>
    </Container>
  );
}