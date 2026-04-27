"use client";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/layout/HeroSection";
import AboutSection from "@/components/layout/AboutSection";
import { UserGuide } from "@/components/layout/UserGuide";

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <div className="w-full">
        <img src="/baner.png" className="w-full h-auto object-cover" alt="Banner" />
      </div>
      <AboutSection />
      <UserGuide />
      <Footer />
    </>
  );
}
