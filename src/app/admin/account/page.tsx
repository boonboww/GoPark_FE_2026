export default function AdminAccountPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl p-6 md:px-8 md:py-6 shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Quản lý tài khoản Admin
        </h1>
        <p className="mt-1 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>Quản lý người dùng và phân quyền hệ thống</p>
      </div>
      <div className="bg-card rounded-lg shadow-sm p-6">
        <p className="text-muted-foreground">
          Trang quản lý tài khoản admin đang được phát triển...
        </p>
      </div>
    </div>
  );
}