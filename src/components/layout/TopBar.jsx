import { useAuth } from "@/context/AuthContext";

export default function TopBar() {
  const { profile, signOut } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white/75 px-6 backdrop-blur-md">
      <p className="hidden md:block text-xl font-bold uppercase tracking-[0.2em] text-muted-foreground">
        H&H Real Estate
      </p>

      <div className="flex items-center gap-4">
        <span className="text-[20px] font-semibold leading-none">
          {profile?.full_name}
        </span>

        <button
          onClick={signOut}
          className="inline-flex items-center text-[15px] 
          font-bold uppercase tracking-widest leading-none 
          text-muted-foreground transition-colors hover:text-foreground border border-muted-foreground hover:border-muted-foreground px-3 py-1 rounded"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
