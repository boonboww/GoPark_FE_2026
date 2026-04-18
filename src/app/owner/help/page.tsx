"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, HelpCircle, Book, Mail, MessageSquare } from "lucide-react";
import { FAQSection } from "@/components/owner/help/faq-section";
import { GuideSection } from "@/components/owner/help/guide-section";
import { ContactForm } from "@/components/owner/help/contact-form";
import { ChatBox } from "@/components/owner/help/chat-box";

export default function HelpCenterPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        
        <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
          {/* Title & Search Section */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trung tâm trợ giúp</h1>
            <p className="text-sm text-muted-foreground w-full">
              Tìm kiếm sự trợ giúp, hướng dẫn vận hành và kết nối với đội ngũ hỗ trợ của GoPark.
            </p>
          </div>
            
          <div className="relative w-full max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input 
              placeholder="Bạn cần hỗ trợ điều gì?..." 
              className="pl-12 h-14 rounded-xl border-border bg-card shadow-sm text-base focus-visible:ring-1"
            />
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="faq" className="w-full">
            <div className="flex justify-start mb-6 w-full overflow-x-auto pb-2">
              <TabsList className="h-12 p-1 bg-muted border border-border rounded-lg justify-start w-max">
                <TabsTrigger value="faq" className="rounded-md px-4 h-full font-medium gap-2 text-sm">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  FAQ
                </TabsTrigger>
                <TabsTrigger value="guides" className="rounded-md px-4 h-full font-medium gap-2 text-sm">
                  <Book className="w-4 h-4 text-muted-foreground" />
                  Hướng dẫn
                </TabsTrigger>
                <TabsTrigger value="contact" className="rounded-md px-4 h-full font-medium gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Liên hệ
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-md px-4 h-full font-medium gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Live Chat
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-2 duration-500">
              <TabsContent value="faq" className="mt-0">
                <FAQSection />
              </TabsContent>
              
              <TabsContent value="guides" className="mt-0">
                <div className="space-y-2 px-1">
                  <h3 className="text-xl font-bold">Tài liệu hướng dẫn</h3>
                  <p className="text-muted-foreground text-sm">Các bước hướng dẫn chi tiết giúp bạn làm quen với nền tảng.</p>
                  <GuideSection />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0">
                <ContactForm />
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <ChatBox />
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom Footer Info */}
          <div className="pt-12 border-t text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Vẫn còn thắc mắc? Liên hệ hotline: <span className="font-bold text-foreground">1900 6868</span> (8:00 - 20:00)
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
