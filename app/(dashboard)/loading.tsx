export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E8E0D5]/60 rounded-xl" />
          <div className="h-4 w-72 bg-[#E8E0D5]/40 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-[#E8E0D5]/50 rounded-full hidden sm:block" />
      </div>

      <div className="card-soft p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-48 h-48 rounded-full border-8 border-[#F2ECE4] border-t-[#E78895]/40 animate-spin" />
        <div className="h-4 w-36 bg-[#E8E0D5]/40 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-soft p-5 h-48 space-y-3">
          <div className="h-5 w-32 bg-[#E8E0D5]/50 rounded-lg" />
          <div className="h-4 w-full bg-[#E8E0D5]/30 rounded" />
          <div className="h-4 w-3/4 bg-[#E8E0D5]/30 rounded" />
        </div>
        <div className="card-soft p-5 h-48 space-y-3">
          <div className="h-5 w-32 bg-[#E8E0D5]/50 rounded-lg" />
          <div className="h-4 w-full bg-[#E8E0D5]/30 rounded" />
          <div className="h-4 w-3/4 bg-[#E8E0D5]/30 rounded" />
        </div>
      </div>
    </div>
  );
}
